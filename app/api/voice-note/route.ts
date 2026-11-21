import { NextResponse } from "next/server";

/* Saves a guest's voice-note gift to Supabase Storage (private "voice-notes" bucket)
   and links it to their row in the guests table. The couple plays them from the thank-you app's host screen. */

const SB = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const EVENT = process.env.EVENT_SLUG || "moday27";
const BUCKET = "voice-notes";
const MAX_BYTES = 1_500_000; // about 30 seconds

export const dynamic = "force-dynamic";

const headers = (extra: Record<string, string> = {}) => {
  const h: Record<string, string> = { apikey: KEY, ...extra };
  if (KEY.startsWith("eyJ")) h.Authorization = `Bearer ${KEY}`;
  return h;
};
const fail = (error: string, status = 400) =>
  NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  if (!SB || !KEY) return fail("Voice notes are not connected.", 503);
  const form = await req.formData().catch(() => null);
  const code = String(form?.get("code") || "");
  const file = form?.get("audio");
  if (!/^[a-z0-9-]{3,24}$/.test(code)) return fail("Missing RSVP.");
  if (!(file instanceof Blob) || file.size < 1500)
    return fail("That recording is too short.");
  if (file.size > MAX_BYTES)
    return fail("That recording is too long. Keep it under 30 seconds.");
  const type = (file.type || "audio/webm").split(";")[0];
  if (!type.startsWith("audio/") && type !== "video/mp4")
    return fail("That isn't audio.");

  try {
    const found = await fetch(
      `${SB}/rest/v1/guests?select=id&event_slug=eq.${EVENT}&code=eq.${code}&limit=1`,
      { headers: headers(), cache: "no-store" },
    ).then((r) => r.json());
    const id = found?.[0]?.id;
    if (!id) return fail("We couldn't find your RSVP.", 404);

    const ext = type.includes("mp4")
      ? "m4a"
      : type.includes("ogg")
        ? "ogg"
        : type.includes("mpeg")
          ? "mp3"
          : "webm";
    const path = `${EVENT}/${code}-${Date.now()}.${ext}`;
    const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: headers({
        "Content-Type": type === "video/mp4" ? "audio/mp4" : type,
        "x-upsert": "true",
      }),
      body: Buffer.from(await file.arrayBuffer()),
    });
    if (!up.ok)
      throw new Error(
        `Upload ${up.status}: ${(await up.text()).slice(0, 200)}`,
      );

    const patch = await fetch(`${SB}/rest/v1/guests?id=eq.${id}`, {
      method: "PATCH",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        voice_path: path,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!patch.ok)
      throw new Error(
        `Link ${patch.status}: ${(await patch.text()).slice(0, 200)}`,
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Voice note failed", e);
    return fail("Couldn't send it just now. Try again?", 500);
  }
}
