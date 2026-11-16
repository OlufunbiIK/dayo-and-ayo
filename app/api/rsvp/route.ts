import { NextResponse } from "next/server";

/* Saves each RSVP to the shared Supabase guest list, which the thank-you app reads after the wedding.
   Runs on the server with the secret key; the guests table has no public access. */

const URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const EVENT = process.env.EVENT_SLUG || "moday27";
const NETWORKS = ["mtn", "airtel", "glo", "etisalat"];

export const dynamic = "force-dynamic";

const cleanPhone = (raw: unknown) => {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("234")) d = "0" + d.slice(3);
  return /^0[789][01]\d{8}$/.test(d) ? d : "";
};
const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

async function db(path: string, method = "GET", body?: unknown) {
  const headers: Record<string, string> = {
    apikey: KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${KEY}`;
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

export async function POST(req: Request) {
  if (!URL || !KEY)
    return NextResponse.json(
      { ok: false, error: "Guest list not connected." },
      { status: 503 },
    );
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 60);
  if (!name)
    return NextResponse.json(
      { ok: false, error: "Name required." },
      { status: 400 },
    );
  const phone = cleanPhone(b.phone);
  const row = {
    event_slug: EVENT,
    name,
    phone: phone || null,
    network: phone && NETWORKS.includes(b.network) ? b.network : null,
    coming: b.coming === "yes" || b.coming === "no" ? b.coming : null,
    seats:
      b.coming === "yes"
        ? Math.min(2, Math.max(1, Number(b.seats) || 1))
        : null,
    days: Array.isArray(b.days)
      ? b.days.slice(0, 6).map((d: unknown) => str(d, 40))
      : null,
    move: str(b.move, 40) || null,
    wish: str(b.wish, 280) || null,
    updated_at: new Date().toISOString(),
  };
  try {
    const existing = phone
      ? await db(
          `guests?select=id,code&event_slug=eq.${EVENT}&phone=eq.${phone}&limit=1`,
        )
      : [];
    if (existing?.[0]) {
      await db(`guests?id=eq.${existing[0].id}`, "PATCH", row); // same number RSVPs again: update, keep their link code
      return NextResponse.json({ ok: true, code: existing[0].code });
    }
    const code = `${
      (name.split(/\s+/)[0] || "guest")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 10) || "guest"
    }-${Math.random().toString(36).slice(2, 6)}`;
    await db("guests", "POST", { ...row, code });
    return NextResponse.json({ ok: true, code });
  } catch (e) {
    console.error("RSVP save failed", e);
    return NextResponse.json(
      { ok: false, error: "Could not save." },
      { status: 500 },
    );
  }
}
