import { NextResponse } from "next/server";

/* Turns what a guest said ("It's Funbi, I dey come with my wife…") into RSVP answers.
   The browser does the speech-to-text; this route asks Claude to pull out the details. */

const KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.VOICE_MODEL || "claude-haiku-5-5";

export const dynamic = "force-dynamic";

const list = (v: unknown) =>
  Array.isArray(v) ? v.slice(0, 8).map((x) => String(x).slice(0, 40)) : [];

export async function POST(req: Request) {
  if (!KEY)
    return NextResponse.json(
      { ok: false, error: "Voice RSVP is not switched on." },
      { status: 503 },
    );
  const b = await req.json().catch(() => ({}));
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 1200) : "";
  if (!text)
    return NextResponse.json(
      { ok: false, error: "Nothing was said." },
      { status: 400 },
    );

  const system = `You turn a wedding guest's spoken RSVP into JSON. Guests may speak English, Nigerian Pidgin, Yoruba, Igbo or Hausa, or mix them.
Reply with ONLY one JSON object. Include a key only if the guest actually said it. Never invent details.
Keys:
- "name": the guest's own name
- "coming": "yes" or "no"
- "seats": 1, or 2 if they are bringing anyone (partner, wife, husband, plus-one)
- "days": array, using only these exact names: ${JSON.stringify(list(b.events))}. "Everything" or "all of it" means all of them.
- "phone": Nigerian phone number as 11 digits starting with 0 (convert spoken words like "zero eight" to digits)
- "move": their dance move, using one of ${JSON.stringify(list(b.moves))} if it matches, otherwise a short phrase
- "wish": their message for the couple, tidied up, under 200 characters, keeping their language and warmth`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: text }],
      }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    const out: string =
      data?.content?.find((c: { type: string }) => c.type === "text")?.text ||
      "";
    const json = out.match(/\{[\s\S]*\}/);
    if (!json) throw new Error("No JSON in reply");
    return NextResponse.json({ ok: true, rsvp: JSON.parse(json[0]) });
  } catch (e) {
    console.error("Voice RSVP failed", e);
    return NextResponse.json(
      { ok: false, error: "Couldn't understand that." },
      { status: 500 },
    );
  }
}
