"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────────────  Edit the couple's details here  ───────────────────────── */
const C = {
  bride: "Morayo",
  groom: "Dayo",
  hashtag: "#MoDay27",
  families: "the Adebayo and Okonkwo families",
  dateISO: "2027-04-17T10:00:00+01:00",
  dateShort: "17 · 04 · 2027",
  city: "Abuja",
  events: [
    {
      day: "Friday",
      date: "16 April",
      time: "4:00 pm",
      start: "2027-04-16T16:00:00+01:00",
      hours: 4,
      title: "The Engagement",
      note: "Introduction, kola and the family handshake. Come dressed in your aso-ebi.",
      place: "The Garden Pavilion, Maitama",
      img: "img/details.jpg",
      pos: "50% 45%",
    },
    {
      day: "Saturday",
      date: "17 April",
      time: "10:00 am",
      start: "2027-04-17T10:00:00+01:00",
      hours: 2,
      title: "The Vows",
      note: "Holy matrimony. Doors close at 10:15, so please come early.",
      place: "Chapel of Grace, Wuse II",
      img: "img/couple.jpg",
      pos: "55% 30%",
    },
    {
      day: "Saturday",
      date: "17 April",
      time: "2:00 pm",
      start: "2027-04-17T14:00:00+01:00",
      hours: 6,
      title: "The Party",
      note: "Small chops, the couple's grand entrance and a dance floor that won't rest.",
      place: "The Glasshouse Hall, Central Area",
      img: "img/venue.jpg",
      pos: "50% 50%",
    },
  ],
  asoebi: [
    {
      name: "Blush aso-oke",
      who: "Ladies · gele & ipele",
      price: "₦35,000",
      pos: "3% 50%",
    },
    {
      name: "Ivory French lace",
      who: "Ladies · buba & iro",
      price: "₦48,000",
      pos: "50% 50%",
    },
    {
      name: "Rose-gold sequin george",
      who: "Gentlemen's fila & ladies' wrapper",
      price: "₦30,000",
      pos: "97% 50%",
    },
  ],
  asoebiUrl: "https://asoebi-sigma.vercel.app/",
  bank: { name: "Demo Bank", number: "0123456789", holder: "Morayo & Dayo" },
  music: " music.mp3",
  payLink: "", // optional: a Paystack payment page link, e.g. https://paystack.com/pay/moday27
  amounts: [2000, 5000, 10000, 20000, 50000],
  wishlist: [
    {
      emoji: "✈️",
      title: "Our honeymoon in Zanzibar",
      note: "Any amount gets us closer to the beach",
    },
    {
      emoji: "🏡",
      title: "Our first home together",
      note: "Pots, curtains, a sofa we'll argue about",
    },
    {
      emoji: "🍲",
      title: "A big pot of jollof for the in-laws",
      note: "₦25,000 keeps everyone happy",
    },
  ],
  madeBy: "https://eventlybuilt-portfolio.vercel.app",
};
/* ───────────────────────────────────────────────────────────────────────────────────── */

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");
const NETS = [
  ["mtn", "MTN"],
  ["airtel", "Airtel"],
  ["glo", "Glo"],
  ["etisalat", "9mobile"],
] as const;
const cleanPhone = (raw: string) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) d = "0" + d.slice(3);
  return /^0[789][01]\d{8}$/.test(d) ? d : "";
};
const guessNet = (raw: string) => {
  const d = raw.replace(/\D/g, "").replace(/^234/, "0");
  const map: Record<string, string> = {
    "0803": "mtn",
    "0806": "mtn",
    "0703": "mtn",
    "0706": "mtn",
    "0813": "mtn",
    "0816": "mtn",
    "0810": "mtn",
    "0814": "mtn",
    "0903": "mtn",
    "0906": "mtn",
    "0913": "mtn",
    "0916": "mtn",
    "0704": "mtn",
    "0802": "airtel",
    "0808": "airtel",
    "0708": "airtel",
    "0812": "airtel",
    "0701": "airtel",
    "0902": "airtel",
    "0907": "airtel",
    "0901": "airtel",
    "0912": "airtel",
    "0911": "airtel",
    "0805": "glo",
    "0807": "glo",
    "0705": "glo",
    "0815": "glo",
    "0811": "glo",
    "0905": "glo",
    "0915": "glo",
    "0809": "etisalat",
    "0818": "etisalat",
    "0817": "etisalat",
    "0909": "etisalat",
    "0908": "etisalat",
  };
  return map[d.slice(0, 4)] || "";
};
const mono = `${C.bride[0]}&${C.groom[0]}`;
const maps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ", Abuja")}`;

/* ═════════ Voice: say your RSVP, and leave a voice-note gift ═════════ */
const MOVE_NAMES = [
  "Legwork",
  "Shaku shaku",
  "Zanku",
  "Whine small",
  "I'm here for pictures",
  "I'm here for the food",
];
type Speech = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
}; // eslint-disable-line @typescript-eslint/no-explicit-any
const speechApi = (): (new () => Speech) | null =>
  typeof window === "undefined"
    ? null
    : (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      null; // eslint-disable-line @typescript-eslint/no-explicit-any
export type VoiceFill = {
  name?: string;
  coming?: "yes" | "no";
  seats?: number;
  days?: string[];
  phone?: string;
  move?: string;
  wish?: string;
};

function VoiceRsvp({ onFill }: { onFill: (p: VoiceFill) => void }) {
  const [ok, setOk] = useState(false);
  const [state, setState] = useState<
    "idle" | "listening" | "thinking" | "error"
  >("idle");
  const [heard, setHeard] = useState("");
  const [msg, setMsg] = useState("");
  const rec = useRef<Speech | null>(null);
  const said = useRef("");
  useEffect(() => {
    setOk(!!speechApi() && process.env.NEXT_PUBLIC_VOICE_RSVP === "on");
    return () => rec.current?.stop();
  }, []);
  if (!ok) return null;

  const understand = async (text: string) => {
    setState("thinking");
    try {
      const res = await fetch("/api/voice-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          events: C.events.map((e) => e.title),
          moves: MOVE_NAMES,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error();
      setState("idle");
      onFill(d.rsvp || {});
    } catch {
      setState("error");
      setMsg("Voice is having a moment. Tap through instead 🤍");
    }
  };
  const start = () => {
    const Api = speechApi();
    if (!Api) return;
    const r = new Api();
    r.lang = "en-NG";
    r.interimResults = true;
    r.continuous = true;
    said.current = "";
    setHeard("");
    setMsg("");
    let final = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      said.current = (final + interim).trim();
      setHeard(said.current);
    };
    r.onerror = (e) => {
      setState("error");
      setMsg(
        e?.error === "not-allowed"
          ? "Please allow the microphone, then try again 🎙️"
          : "I didn't catch that. Try again?",
      );
    };
    r.onend = () => {
      rec.current = null;
      if (said.current) understand(said.current);
      else setState((s) => (s === "listening" ? "idle" : s));
    };
    rec.current = r;
    r.start();
    setState("listening");
  };

  return (
    <div className={`voice-rsvp ${state}`}>
      <p className="vr-or">
        <span>or</span>
      </p>
      <button
        type="button"
        className={`mic-btn ${state === "listening" ? "on" : ""}`}
        onClick={state === "listening" ? () => rec.current?.stop() : start}
        disabled={state === "thinking"}
      >
        <span className="mic-dot">
          {state === "thinking" ? (
            <span className="spin" />
          ) : state === "listening" ? (
            "■"
          ) : (
            "🎙️"
          )}
        </span>
        {state === "listening"
          ? "Done talking"
          : state === "thinking"
            ? "Filling it in…"
            : "Just say it"}
      </button>
      {state === "listening" || state === "thinking" ? (
        <p className="vr-heard">{heard || "Listening… 👂🏾"}</p>
      ) : (
        <p className="vr-hint">
          e.g. &ldquo;It&rsquo;s Tolu, I dey come with my wife for the vows and
          the party. 0805 036 6355. Una go last!&rdquo;
        </p>
      )}
      {msg && <p className="vr-msg">{msg}</p>}
    </div>
  );
}

function VoiceNote({ code, name }: { code: string; name: string }) {
  const MAX = 30;
  const [ok, setOk] = useState(false);
  const [st, setSt] = useState<"idle" | "rec" | "review" | "sending" | "sent">(
    "idle",
  );
  const [secs, setSecs] = useState(0);
  const [url, setUrl] = useState("");
  const [bars, setBars] = useState<number[]>(() => Array(14).fill(0.15));
  const [msg, setMsg] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const blob = useRef<Blob | null>(null);
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => {
    setOk(
      !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined",
    );
    return () => cleanup.current();
  }, []);
  if (!ok) return null;

  const start = async () => {
    setMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
        (t) => MediaRecorder.isTypeSupported(t),
      );
      const r = new MediaRecorder(
        stream,
        type ? { mimeType: type } : undefined,
      );
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      let raf = 0;
      const draw = () => {
        an.getByteFrequencyData(buf);
        setBars(
          Array.from({ length: 14 }, (_, i) =>
            Math.max(0.15, buf[i + 1] / 255),
          ),
        );
        raf = requestAnimationFrame(draw);
      };
      draw();
      const t0 = Date.now();
      const tick = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        setSecs(s);
        if (s >= MAX && r.state === "recording") r.stop();
      }, 200);
      cleanup.current = () => {
        cancelAnimationFrame(raf);
        clearInterval(tick);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
      };
      r.onstop = () => {
        cleanup.current();
        blob.current = new Blob(chunks, {
          type: r.mimeType || type || "audio/webm",
        });
        setUrl(URL.createObjectURL(blob.current));
        setSt("review");
      };
      rec.current = r;
      r.start(250);
      setSecs(0);
      setSt("rec");
    } catch {
      setMsg("Please allow the microphone to record 🎙️");
    }
  };
  const stop = () => {
    if (rec.current?.state === "recording") rec.current.stop();
  };
  const redo = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl("");
    blob.current = null;
    setSt("idle");
  };
  const send = async () => {
    if (!blob.current) return;
    setSt("sending");
    setMsg("");
    const fd = new FormData();
    fd.append("code", code);
    fd.append("audio", blob.current, "voice-note");
    try {
      const d = await fetch("/api/voice-note", {
        method: "POST",
        body: fd,
      }).then((r) => r.json());
      if (!d.ok) throw new Error(d.error);
      setSt("sent");
    } catch (e) {
      setSt("review");
      setMsg(
        e instanceof Error && e.message
          ? e.message
          : "Couldn't send. Try again?",
      );
    }
  };

  return (
    <div className={`vnote ${st}`}>
      {st === "sent" ? (
        <>
          <div className="vn-gift" aria-hidden="true">
            🎁
          </div>
          <p className="vn-t">Voice gift wrapped!</p>
          <p className="vn-s">
            {C.bride} &amp; {C.groom} will unwrap it after the wedding 🤍
          </p>
        </>
      ) : (
        <>
          <p className="vn-t">🎙️ Leave them a voice-note gift</p>
          <p className="vn-s">
            {name ? `${name.split(" ")[0]}, scream` : "Scream"}, sing, pray or
            toast. They&rsquo;ll hear it after the wedding.
          </p>
          {st === "idle" && (
            <div className="vn-ideas">
              {[
                "🎉 Shout your congrats",
                "🎤 Sing them a line",
                "🥂 Make a toast",
                "😂 A funny memory",
              ].map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          )}
          {st === "rec" && (
            <>
              <div className="vn-bars" aria-hidden="true">
                {bars.map((v, i) => (
                  <i key={i} style={{ transform: `scaleY(${v})` }} />
                ))}
              </div>
              <p className="vn-time">
                <span className="rec-dot" /> 0:{String(secs).padStart(2, "0")}{" "}
                <small>/ 0:{MAX}</small>
              </p>
            </>
          )}
          {(st === "review" || st === "sending") && (
            <audio className="vn-play" src={url} controls />
          )}
          {msg && <p className="vr-msg">{msg}</p>}
          {st === "idle" && (
            <button type="button" className="mic-btn big" onClick={start}>
              <span className="mic-dot">🎙️</span>Tap to record
            </button>
          )}
          {st === "rec" && (
            <button
              type="button"
              className="mic-btn big on"
              onClick={stop}
              disabled={secs < 1}
            >
              <span className="mic-dot">■</span>Stop
            </button>
          )}
          {(st === "review" || st === "sending") && (
            <div className="vn-actions">
              <button
                type="button"
                className="btn"
                onClick={send}
                disabled={st === "sending"}
              >
                {st === "sending" ? (
                  <>
                    <span className="spin" /> Wrapping…
                  </>
                ) : (
                  "Wrap it & send 🎁"
                )}
              </button>
              <button
                type="button"
                className="backlink"
                onClick={redo}
                disabled={st === "sending"}
              >
                Record again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Soft rose-gold sparkles */
function Sparkle({ count = 40 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0,
      h = 0,
      raf = 0,
      visible = true;
    const resize = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    });
    io.observe(c);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ps = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.6,
      s: Math.random() * 0.5 + 0.15,
      t: Math.random() * 6.3,
    }));
    function draw() {
      raf = 0;
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!still) {
          p.y -= p.s / Math.max(h, 1);
          p.t += 0.03;
          if (p.y < -0.02) {
            p.y = 1.02;
            p.x = Math.random();
          }
        }
        const a = 0.2 + 0.8 * Math.abs(Math.sin(p.t));
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,236,226,${a})`;
        ctx.shadowColor = "rgba(233,170,150,.9)";
        ctx.shadowBlur = 10;
        ctx.fill();
      }
      if (visible && !still) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [count]);
  return <canvas ref={ref} className="sparkle" aria-hidden="true" />;
}

const Divider = () => (
  <svg className="divider" viewBox="0 0 240 20" aria-hidden="true">
    <defs>
      <linearGradient id="rg" x1="0" x2="1">
        <stop offset="0" stopColor="#b9787f" stopOpacity="0" />
        <stop offset=".5" stopColor="#c9898a" />
        <stop offset="1" stopColor="#b9787f" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M0 10h98M142 10h98" stroke="url(#rg)" strokeWidth="1" />
    <path d="M120 3c4 4 4 10 0 14-4-4-4-10 0-14z" fill="#d9a59c" />
    <path
      d="M113 10c4-4 10-4 14 0-4 4-10 4-14 0z"
      fill="#b9787f"
      opacity=".7"
    />
    <circle cx="104" cy="10" r="1.8" fill="#b9787f" />
    <circle cx="136" cy="10" r="1.8" fill="#b9787f" />
  </svg>
);

const NOTES = 6;
const DENOMS = [
  { v: "200", words: "Two Hundred Naira", cls: "n200" },
  { v: "500", words: "Five Hundred Naira", cls: "n500" },
  { v: "1000", words: "One Thousand Naira", cls: "n1000" },
  { v: "500", words: "Five Hundred Naira", cls: "n500" },
  { v: "200", words: "Two Hundred Naira", cls: "n200" },
  { v: "1000", words: "One Thousand Naira", cls: "n1000" },
];
const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37 + 7) % 100,
  delay: -((i * 1.7) % 14),
  dur: 12 + ((i * 5) % 9),
  size: 10 + ((i * 7) % 10),
  sway: 30 + ((i * 13) % 50),
}));
const Petals = () => (
  <div className="petals" aria-hidden="true">
    {PETALS.map((p, i) => (
      <span
        key={i}
        style={
          {
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            "--sway": `${p.sway}px`,
          } as React.CSSProperties
        }
      />
    ))}
  </div>
);

export default function Invite() {
  const [guest, setGuest] = useState("");
  const [step, setStep] = useState(0); // 0 closed · 1 seal glow · 2 zoom · 3 open
  const [sprayed, setSprayed] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [music, setMusic] = useState<"none" | "off" | "on">("none");
  const [copied, setCopied] = useState(false);
  const [rsvp, setRsvp] = useState<{
    name: string;
    coming: "" | "yes" | "no";
    phone: string;
    network: string;
    seats: number;
    days: string[];
    move: string;
    wish: string;
  }>({
    name: "",
    coming: "",
    phone: "",
    network: "",
    seats: 1,
    days: [],
    move: "",
    wish: "",
  });
  const savedRsvp = useRef("");
  const [rsvpCode, setRsvpCode] = useState("");
  const [rStep, setRStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [realNote, setRealNote] = useState(false);
  const [gift, setGift] = useState<{
    amt: number;
    custom: string;
    item: string;
    flying: number;
    stage: "pick" | "send";
  }>({ amt: 10000, custom: "", item: "", flying: 0, stage: "pick" });
  const audio = useRef<HTMLAudioElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const done = sprayed >= NOTES;

  const flights = useMemo(
    () =>
      Array.from({ length: NOTES }, (_, i) => ({
        dx: (i % 2 ? 1 : -1) * (160 + ((i * 53) % 140)),
        dy: -240 - ((i * 71) % 180),
        rot: (i % 2 ? 1 : -1) * (50 + ((i * 37) % 90)),
        tilt: ((i * 29) % 12) - 6,
      })),
    [],
  );
  const rain = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        left: (i * 47) % 100,
        delay: (i % 12) * 0.11,
        dur: 2.6 + ((i * 13) % 10) / 6,
        rot: ((i * 67) % 360) - 180,
        sway: ((i * 31) % 80) - 40,
        petal: i % 3 === 0,
      })),
    [],
  );

  useEffect(() => {
    const to = new URLSearchParams(window.location.search).get("to");
    if (to) {
      setGuest(to.slice(0, 40));
      setRsvp((r) => ({ ...r, name: to.slice(0, 40) }));
    }
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    {
      const im = new Image();
      im.onload = () => setRealNote(true);
      im.src = "img/naira-note.jpg";
    }
    if (C.music) setMusic("off");
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = step === 3 ? "" : "hidden";
  }, [step]);

  useEffect(() => {
    if (step !== 3) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        heroRef.current?.style.setProperty(
          "--sy",
          String(Math.min(window.scrollY, 1000)),
        );
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [step]);

  const open = useCallback(() => {
    if (step !== 0) return;
    if (music === "off" && audio.current)
      audio.current
        .play()
        .then(() => setMusic("on"))
        .catch(() => {});
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(3);
      return;
    }
    setStep(1);
    setTimeout(() => setStep(2), 500);
    setTimeout(() => setStep(3), 1700);
  }, [step, music]);

  const toggleMusic = () => {
    const a = audio.current;
    if (!a) return;
    if (music === "on") {
      a.pause();
      setMusic("off");
    } else
      a.play()
        .then(() => setMusic("on"))
        .catch(() => {});
  };

  const left =
    now === null ? null : Math.max(0, new Date(C.dateISO).getTime() - now);
  const cd =
    left === null
      ? ["--", "--", "--", "--"]
      : [
          Math.floor(left / 864e5),
          Math.floor(left / 36e5) % 24,
          Math.floor(left / 6e4) % 60,
          Math.floor(left / 1e3) % 60,
        ].map((v, i) => (i === 0 ? String(v) : pad(v)));

  const addToCalendar = (e: (typeof C.events)[number]) => {
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const s = new Date(e.start),
      end = new Date(s.getTime() + e.hours * 36e5);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Eventlybuilt//IV//EN",
      "BEGIN:VEVENT",
      `UID:${s.getTime()}@eventlybuilt`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(s)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${C.bride} & ${C.groom} · ${e.title}`,
      `LOCATION:${e.place}\\, ${C.city}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${C.bride}-${C.groom}-${e.title.replace(/\W+/g, "-")}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(C.bank.number);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
  const giftAmt = gift.custom
    ? Math.max(0, parseInt(gift.custom.replace(/\D/g, "") || "0", 10))
    : gift.amt;
  const sprayGift = (item = "") => {
    setGift((g) => ({ ...g, item, flying: g.flying + 1 }));
    setTimeout(() => setGift((g) => ({ ...g, stage: "send" })), 1100);
  };
  const tellCouple = () => {
    const who = rsvp.name || guest || "";
    const what = gift.item
      ? `I'm gifting you: ${gift.item} 🎁`
      : `I just sprayed you ${naira(giftAmt)} 💸`;
    const text = [
      `Hello ${C.bride} & ${C.groom}!${who ? ` It's ${who}.` : ""}`,
      what,
      "Wishing you a lifetime of love 🤍",
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  const steps =
    rsvp.coming === "no"
      ? ["name", "coming", "phone", "wish", "done"]
      : ["name", "coming", "phone", "seats", "days", "move", "wish", "done"];
  const cur = steps[Math.min(rStep, steps.length - 1)];
  const next = () => setRStep((n) => Math.min(n + 1, steps.length - 1));
  const back = () => setRStep((n) => Math.max(n - 1, 0));
  const pick = (patch: Partial<typeof rsvp>, go = true) => {
    setRsvp((r) => ({ ...r, ...patch }));
    if (go) setTimeout(next, 380);
  };
  const toggleDay = (d: string) =>
    setRsvp((r) => ({
      ...r,
      days: r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d],
    }));
  // Save the RSVP to the guest list once the guest reaches the end (the thank-you app reads the same list).
  useEffect(() => {
    if (cur !== "done") return;
    const body = JSON.stringify({ ...rsvp, phone: cleanPhone(rsvp.phone) });
    if (savedRsvp.current === body) return;
    savedRsvp.current = body;
    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.code) setRsvpCode(d.code);
      })
      .catch(() => {});
  }, [cur, rsvp]);
  // Voice RSVP: fill in whatever the guest said, then jump to the first question still unanswered.
  const fillFromVoice = (p: VoiceFill) => {
    const days = Array.isArray(p.days)
      ? p.days.filter((d) => C.events.some((e) => e.title === d))
      : [];
    const phone = typeof p.phone === "string" ? cleanPhone(p.phone) : "";
    const merged = {
      ...rsvp,
      ...(typeof p.name === "string" && p.name.trim()
        ? { name: p.name.trim().slice(0, 40) }
        : {}),
      ...(p.coming === "yes" || p.coming === "no" ? { coming: p.coming } : {}),
      ...(p.seats === 1 || p.seats === 2 ? { seats: p.seats } : {}),
      ...(days.length ? { days } : {}),
      ...(phone ? { phone, network: guessNet(phone) || rsvp.network } : {}),
      ...(typeof p.move === "string" && p.move.trim()
        ? { move: p.move.trim().slice(0, 40) }
        : {}),
      ...(typeof p.wish === "string" && p.wish.trim()
        ? { wish: p.wish.trim().slice(0, 200) }
        : {}),
    };
    setRsvp(merged);
    const order =
      merged.coming === "no"
        ? ["name", "coming", "phone", "wish", "done"]
        : ["name", "coming", "phone", "seats", "days", "move", "wish", "done"];
    const missing: Record<string, boolean> = {
      name: !merged.name,
      coming: !merged.coming,
      phone: !merged.phone || !merged.network,
      seats: p.seats !== 1 && p.seats !== 2,
      days: !merged.days.length,
      move: !merged.move,
      wish: !merged.wish,
    };
    const first = order.findIndex((st) => missing[st]);
    setRStep(first === -1 ? order.length - 1 : first);
  };
  const sendRsvp = () => {
    const lines =
      rsvp.coming === "yes"
        ? [
            `Hello ${C.bride} & ${C.groom}! It's ${rsvp.name} 💃`,
            `I'm coming! (${rsvp.seats === 1 ? "just me" : "me + 1"})`,
            rsvp.days.length ? `I'll be at: ${rsvp.days.join(", ")}` : "",
            rsvp.move ? `My dance-floor move: ${rsvp.move}` : "",
            rsvp.wish ? `My wish for you: ${rsvp.wish}` : "",
          ]
        : [
            `Hello ${C.bride} & ${C.groom}! It's ${rsvp.name}.`,
            "I can't make it, but I'm celebrating with you from afar 🤍",
            rsvp.wish ? `My wish for you: ${rsvp.wish}` : "",
          ];
    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`,
      "_blank",
    );
    setSent(true);
  };

  return (
    <>
      {C.music && <audio ref={audio} src={C.music} loop preload="none" />}

      {/* ═════════ Envelope ═════════ */}
      {step < 3 && (
        <div
          className={`gate s${step}`}
          role="dialog"
          aria-label="Your wedding invitation"
        >
          <div className="gate-photo">
            <img
              className="bg"
              src="img/envelope.jpg"
              alt=""
              aria-hidden="true"
            />
            <img className="fg" src="img/envelope.jpg" alt="" />
          </div>
          <div className="gate-wash" />
          <Sparkle count={36} />
          <p className="gate-top">
            {C.bride} <span>&amp;</span> {C.groom}
          </p>
          <button
            className="seal-hit"
            onClick={open}
            aria-label="Open your invitation"
          >
            <span className="ring" />
            <span className="ring r2" />
          </button>
          <div className="gate-bottom">
            <p className="for">
              {guest ? (
                <>
                  Specially for <b>{guest}</b>
                </>
              ) : (
                <>You&rsquo;re invited</>
              )}
            </p>
            <button className="open-btn" onClick={open}>
              Tap the seal to open
            </button>
          </div>
        </div>
      )}

      {music !== "none" && (
        <button
          className={`music ${music}`}
          onClick={toggleMusic}
          aria-label={music === "on" ? "Pause music" : "Play music"}
        >
          <i />
          <i />
          <i />
          <i />
        </button>
      )}

      <main className={`page ${step === 3 ? "shown" : ""}`}>
        {/* ═════════ Hero ═════════ */}
        <section className="hero" ref={heroRef}>
          <picture className="hero-photo">
            <source
              media="(min-aspect-ratio: 3/2)"
              srcSet="img/hero-wide.jpg"
            />
            <img
              src="img/couple.jpg"
              alt={`${C.bride} and ${C.groom} in their traditional attire, with Aso Rock behind them`}
            />
          </picture>
          <div className="hero-wash" />
          <Petals />
          <div className="hero-copy">
            <p className="kicker">
              {guest
                ? `${guest}, you're invited to the wedding of`
                : "You're invited to the wedding of"}
            </p>
            <h1 className="names">
              <span className="foil n1">{C.bride}</span>
              <span className="amp">&amp;</span>
              <span className="foil n2">{C.groom}</span>
            </h1>
            <p className="hero-date">
              {C.dateShort}
              <i />
              {C.city}
            </p>
          </div>
          <a href="#letter" className="scroll-cue" aria-label="Scroll down">
            <span />
          </a>
        </section>

        {/* ═════════ Letter ═════════ */}
        <section id="letter" className="letter">
          <img
            className="bloom tl"
            src="img/florals.jpg"
            alt=""
            aria-hidden="true"
          />
          <img
            className="bloom br"
            src="img/florals.jpg"
            alt=""
            aria-hidden="true"
          />
          <Petals />
          <div className="letter-in rv">
            <p className="kicker">With joy in our hearts</p>
            <p className="letter-body">
              Together with {C.families}, <em>{C.bride}</em> and{" "}
              <em>{C.groom}</em> invite you to share the weekend they become
              one. There will be prayers, there will be jollof, and there will
              be dancing. Your seat is waiting.
            </p>
            <Divider />
            <p className="sign">
              With love,{" "}
              <span className="foil">
                {C.bride} &amp; {C.groom}
              </span>
            </p>
          </div>
        </section>

        {/* ═════════ Spray to reveal ═════════ */}
        <section className={`blush spray-wrap ${done ? "done" : ""}`} id="date">
          <div className="spray-bg" aria-hidden="true">
            <img
              className="bg-a"
              src="img/naira-spray.jpg"
              alt=""
              loading="lazy"
            />
            <img
              className="bg-b"
              src="img/naira-floor.jpg"
              alt=""
              loading="lazy"
            />
          </div>
          {done && (
            <div className="rain" aria-hidden="true">
              {rain.map((r, i) => (
                <span
                  key={i}
                  className={
                    r.petal
                      ? "petal"
                      : realNote
                        ? "real"
                        : DENOMS[i % NOTES].cls
                  }
                  style={
                    {
                      left: `${r.left}%`,
                      animationDelay: `${r.delay}s`,
                      animationDuration: `${r.dur}s`,
                      ...(realNote && !r.petal
                        ? { backgroundImage: "url(img/naira-note.jpg)" }
                        : {}),
                      "--rot": `${r.rot}deg`,
                      "--sway": `${r.sway}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
          <div className="inner rv">
            <p className="kicker">Save the date</p>
            <h2>Spray us to see the date</h2>
            <p className="hint">
              {done
                ? "Now you know. Mark your calendar."
                : `Tap the notes · ${NOTES - sprayed} to go`}
            </p>
            <button
              className="stack"
              onClick={() => setSprayed((s) => Math.min(NOTES, s + 1))}
              disabled={done}
              aria-label={done ? "Saturday 17 April 2027" : "Spray a note"}
            >
              <div className={`date-card ${done ? "lit" : ""}`}>
                <span className="wd">Saturday</span>
                <span className="foil d">17</span>
                <span className="my">
                  April <b>2027</b>
                </span>
              </div>
              {flights.map((f, i) => (
                <span
                  key={i}
                  className={`note ${realNote ? "real" : DENOMS[i].cls} ${sprayed > NOTES - 1 - i ? "fly" : ""}`}
                  style={
                    {
                      "--dx": `${f.dx}px`,
                      "--dy": `${f.dy}px`,
                      "--rot": `${f.rot}deg`,
                      "--tilt": `${f.tilt}deg`,
                      zIndex: i + 2,
                    } as React.CSSProperties
                  }
                >
                  {realNote ? (
                    <span
                      className="note-photo"
                      style={{ backgroundImage: "url(img/naira-note.jpg)" }}
                    >
                      <span className="spray-tag">Wedding spray</span>
                    </span>
                  ) : (
                    <span className="note-in">
                      <span className="flag">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className="den tl">₦{DENOMS[i].v}</span>
                      <span className="den br">{DENOMS[i].v}</span>
                      <span className="seal-mark">{mono}</span>
                      <span className="words">{DENOMS[i].words}</span>
                      <span className="micro">
                        Wedding spray · not legal tender · {C.hashtag}
                      </span>
                    </span>
                  )}
                </span>
              ))}
            </button>
            <div className="digits">
              {["Days", "Hours", "Minutes", "Seconds"].map((l, i) => (
                <div key={l}>
                  <span>{cd[i]}</span>
                  <small>{l}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════ Weekend ═════════ */}
        <section className="weekend">
          <div className="head rv">
            <p className="kicker">The weekend</p>
            <h2>Two days, one big love</h2>
            <Divider />
          </div>
          <div className="events">
            {C.events.map((e, i) => (
              <article
                key={e.title}
                className="event rv"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="ev-photo">
                  <img
                    src={e.img}
                    alt=""
                    style={{ objectPosition: e.pos }}
                    loading="lazy"
                  />
                  <div className="ev-when">
                    <span>{e.day}</span>
                    <b>{e.date}</b>
                    <span>{e.time}</span>
                  </div>
                </div>
                <div className="ev-body">
                  <h3>{e.title}</h3>
                  <p>{e.note}</p>
                  <p className="where">{e.place}</p>
                  <div className="ev-actions">
                    <button className="chip" onClick={() => addToCalendar(e)}>
                      Add to calendar
                    </button>
                    <a
                      className="chip"
                      href={maps(e.place)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ═════════ Aso-ebi ═════════ */}
        <section className="aso blush">
          <div className="head rv">
            <p className="kicker">Colours of the day</p>
            <h2>Wear the family colours</h2>
            <Divider />
          </div>
          <div className="fabrics rv">
            {C.asoebi.map((f) => (
              <figure key={f.name}>
                <div
                  className="swatch"
                  style={{
                    backgroundImage: "url(img/fabrics.jpg)",
                    backgroundPosition: f.pos,
                  }}
                >
                  <span className="tag">{f.price}</span>
                </div>
                <figcaption>
                  <b>{f.name}</b>
                  {f.who}
                </figcaption>
              </figure>
            ))}
          </div>
          <a
            className="btn rv"
            href={C.asoebiUrl}
            target="_blank"
            rel="noreferrer"
          >
            Order your aso-ebi
          </a>
        </section>

        {/* ═════════ RSVP ═════════ */}
        <section className="rsvp" id="rsvp">
          <img
            className="bloom tl"
            src="img/florals.jpg"
            alt=""
            aria-hidden="true"
          />
          <div className="card quiz rv">
            <p className="kicker">Kindly reply by 1 March</p>
            <h2>Will you be there?</h2>
            <div className="beadbar" aria-hidden="true">
              {steps.slice(0, -1).map((st, i) => (
                <span
                  key={st}
                  className={i < rStep ? "on" : i === rStep ? "now" : ""}
                />
              ))}
            </div>

            <div className="q" key={cur + (sent ? "-sent" : "")}>
              {cur === "name" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (rsvp.name.trim()) next();
                  }}
                >
                  <p className="qt">First things first, who&rsquo;s this?</p>
                  <input
                    className="big-in"
                    value={rsvp.name}
                    onChange={(e) => setRsvp({ ...rsvp, name: e.target.value })}
                    placeholder="Type your name"
                    aria-label="Your name"
                  />
                  <button
                    className="btn"
                    type="submit"
                    disabled={!rsvp.name.trim()}
                  >
                    That&rsquo;s me →
                  </button>
                  <VoiceRsvp onFill={fillFromVoice} />
                </form>
              )}

              {cur === "coming" && (
                <>
                  <p className="qt">
                    So, {rsvp.name.split(" ")[0] || "friend"}… are you coming to
                    chop jollof with us?
                  </p>
                  <div className="cards2">
                    <button
                      className={`pickcard ${rsvp.coming === "yes" ? "on" : ""}`}
                      onClick={() => pick({ coming: "yes" })}
                    >
                      <span className="emo">💃🏾</span>
                      <b>I dey come!</b>
                      <small>Wouldn&rsquo;t miss it</small>
                    </button>
                    <button
                      className={`pickcard ${rsvp.coming === "no" ? "on" : ""}`}
                      onClick={() => pick({ coming: "no" })}
                    >
                      <span className="emo">🥹</span>
                      <b>I go miss am</b>
                      <small>Celebrating from afar</small>
                    </button>
                  </div>
                </>
              )}

              {cur === "phone" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    next();
                  }}
                >
                  <p className="qt">
                    Drop your number 📲{" "}
                    <span>
                      For venue updates… and a little surprise after the wedding
                      👀
                    </span>
                  </p>
                  <input
                    className="big-in"
                    inputMode="tel"
                    value={rsvp.phone}
                    onChange={(e) =>
                      setRsvp({
                        ...rsvp,
                        phone: e.target.value,
                        network: guessNet(e.target.value) || rsvp.network,
                      })
                    }
                    placeholder="0805 036 6355"
                    aria-label="Phone number"
                  />
                  <div className="nets" role="radiogroup" aria-label="Network">
                    {NETS.map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={rsvp.network === id}
                        className={rsvp.network === id ? "on" : ""}
                        onClick={() => setRsvp({ ...rsvp, network: id })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn"
                    type="submit"
                    disabled={
                      !!rsvp.phone && (!cleanPhone(rsvp.phone) || !rsvp.network)
                    }
                  >
                    {rsvp.phone ? "Next →" : "Skip for now →"}
                  </button>
                </form>
              )}

              {cur === "seats" && (
                <>
                  <p className="qt">Who&rsquo;s rolling with you?</p>
                  <div className="cards2">
                    <button
                      className={`pickcard ${rsvp.seats === 1 ? "on" : ""}`}
                      onClick={() => pick({ seats: 1 })}
                    >
                      <span className="emo">🙋🏾</span>
                      <b>Just me</b>
                      <small>1 seat</small>
                    </button>
                    <button
                      className={`pickcard ${rsvp.seats === 2 ? "on" : ""}`}
                      onClick={() => pick({ seats: 2 })}
                    >
                      <span className="emo">👫🏾</span>
                      <b>Me + 1</b>
                      <small>2 seats</small>
                    </button>
                  </div>
                </>
              )}

              {cur === "days" && (
                <>
                  <p className="qt">
                    Which parts are you joining? <span>Tap all that apply</span>
                  </p>
                  <div className="daychips">
                    {C.events.map((e) => (
                      <button
                        key={e.title}
                        className={`daychip ${rsvp.days.includes(e.title) ? "on" : ""}`}
                        onClick={() => toggleDay(e.title)}
                        aria-pressed={rsvp.days.includes(e.title)}
                      >
                        <span className="tick">
                          {rsvp.days.includes(e.title) ? "✓" : ""}
                        </span>
                        <b>{e.title}</b>
                        <small>
                          {e.day.slice(0, 3)} {e.date} · {e.time}
                        </small>
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn"
                    onClick={next}
                    disabled={!rsvp.days.length}
                  >
                    Next →
                  </button>
                </>
              )}

              {cur === "move" && (
                <>
                  <p className="qt">
                    Important question. What&rsquo;s your dance-floor move?{" "}
                    <span>The DJ is taking notes</span>
                  </p>
                  <div className="moves">
                    {[
                      ["🕺🏾", "Legwork"],
                      ["💃🏾", "Shaku shaku"],
                      ["🔥", "Zanku"],
                      ["🙌🏾", "Whine small"],
                      ["📸", "I'm here for pictures"],
                      ["🍲", "I'm here for the food"],
                    ].map(([e, m]) => (
                      <button
                        key={m}
                        className={`move ${rsvp.move === m ? "on" : ""}`}
                        onClick={() => pick({ move: m })}
                      >
                        <span>{e}</span>
                        {m}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {cur === "wish" && (
                <>
                  <p className="qt">
                    Any words for the couple?{" "}
                    <span>Tap one or write your own</span>
                  </p>
                  <div className="wishes">
                    {[
                      "Una go last o! 🤍",
                      "Happy married life!",
                      "God bless your home 🙏🏾",
                      "Dayo, you did well 😄",
                    ].map((w) => (
                      <button
                        key={w}
                        className={`wish ${rsvp.wish === w ? "on" : ""}`}
                        onClick={() => setRsvp({ ...rsvp, wish: w })}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={rsvp.wish}
                    onChange={(e) => setRsvp({ ...rsvp, wish: e.target.value })}
                    placeholder="Or type something sweet…"
                    aria-label="Your wish for the couple"
                  />
                  <button className="btn" onClick={next}>
                    {rsvp.wish ? "Add my wish →" : "Skip →"}
                  </button>
                </>
              )}

              {cur === "done" && (
                <div className="done-box">
                  <div className="burst" aria-hidden="true">
                    {Array.from({ length: 18 }, (_, i) => (
                      <i
                        key={i}
                        style={
                          {
                            "--a": `${i * 20}deg`,
                            "--d": `${70 + (i % 3) * 30}px`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                  <p className="foil yay">
                    {rsvp.coming === "yes" ? "E se gan!" : "We'll miss you!"}
                  </p>
                  <div className="ticket-sum">
                    <p className="ts-name">{rsvp.name}</p>
                    {rsvp.coming === "yes" ? (
                      <>
                        <p>
                          <span>Seats</span>
                          {rsvp.seats === 1 ? "Just me" : "Me + 1"}
                        </p>
                        <p>
                          <span>Joining</span>
                          {rsvp.days.join(" · ")}
                        </p>
                        {rsvp.move && (
                          <p>
                            <span>Signature move</span>
                            {rsvp.move}
                          </p>
                        )}
                      </>
                    ) : (
                      <p>
                        <span>Status</span>Celebrating from afar
                      </p>
                    )}
                    {rsvp.wish && (
                      <p className="ts-wish">&ldquo;{rsvp.wish}&rdquo;</p>
                    )}
                  </div>
                  <button className="btn" onClick={sendRsvp}>
                    {sent
                      ? "Send again on WhatsApp"
                      : "Send to the couple on WhatsApp"}
                  </button>
                  {sent && (
                    <p className="small-note">
                      Opened in WhatsApp. Just tap send!
                    </p>
                  )}
                  {rsvpCode && <VoiceNote code={rsvpCode} name={rsvp.name} />}
                </div>
              )}
            </div>

            {rStep > 0 && cur !== "done" && (
              <button className="backlink" onClick={back}>
                ← Back
              </button>
            )}
            {cur === "done" && (
              <button
                className="backlink"
                onClick={() => {
                  setRStep(0);
                  setSent(false);
                }}
              >
                Start over
              </button>
            )}
          </div>
        </section>

        {/* ═════════ Gifts + farewell ═════════ */}
        <section className="gift">
          <div className="head rv">
            <p className="kicker">Gifts, the easy way</p>
            <h2>Spray us from anywhere</h2>
            <p className="soft">
              No wrapping paper, no traffic, no stress. Send your love in a few
              taps, from wherever you are.
            </p>
            <Divider />
          </div>

          <div className="gift-grid">
            <div className="gift-card spray-card rv">
              <div className="gc-photo">
                <img src="img/naira-stack.jpg" alt="" loading="lazy" />
                <span className="gc-badge">Digital spray</span>
              </div>
              {gift.stage === "pick" ? (
                <div className="gc-body">
                  <p className="gc-q">How much are you spraying?</p>
                  <div className="amts">
                    {C.amounts.map((a) => (
                      <button
                        key={a}
                        className={`amt ${!gift.custom && gift.amt === a ? "on" : ""}`}
                        onClick={() => setGift({ ...gift, amt: a, custom: "" })}
                      >
                        {naira(a)}
                      </button>
                    ))}
                    <input
                      className={`amt custom ${gift.custom ? "on" : ""}`}
                      inputMode="numeric"
                      placeholder="Other ₦"
                      value={gift.custom}
                      onChange={(e) =>
                        setGift({
                          ...gift,
                          custom: e.target.value.replace(/[^\d,]/g, ""),
                        })
                      }
                      aria-label="Other amount"
                    />
                  </div>
                  <button
                    className="btn spray-btn"
                    onClick={() => sprayGift("")}
                    disabled={!giftAmt}
                  >
                    Spray {giftAmt ? naira(giftAmt) : ""} 💸
                    <span
                      className="fly-notes"
                      aria-hidden="true"
                      key={gift.flying}
                    >
                      {gift.flying > 0 &&
                        Array.from({ length: 9 }, (_, i) => (
                          <i
                            key={i}
                            style={
                              {
                                "--x": `${(i - 4) * 26}px`,
                                "--r": `${(i - 4) * 14}deg`,
                                animationDelay: `${i * 0.05}s`,
                              } as React.CSSProperties
                            }
                          />
                        ))}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="gc-body send">
                  <p className="gc-q">
                    {gift.item ? (
                      <>
                        You&rsquo;re gifting <b>{gift.item}</b>
                      </>
                    ) : (
                      <>
                        Your <b>{naira(giftAmt)}</b> spray is ready
                      </>
                    )}
                  </p>
                  <p className="gc-hint">
                    Send it to the couple&rsquo;s account, then let them know.
                  </p>
                  <div className="acct">
                    <div>
                      <small>
                        {C.bank.name} · {C.bank.holder}
                      </small>
                      <b>{C.bank.number}</b>
                    </div>
                    <button className="chip" onClick={copy}>
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  {C.payLink && (
                    <a
                      className="btn ghost"
                      href={C.payLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Pay with card instead
                    </a>
                  )}
                  <button className="btn" onClick={tellCouple}>
                    Tell them on WhatsApp
                  </button>
                  <button
                    className="backlink"
                    onClick={() =>
                      setGift({ ...gift, stage: "pick", item: "" })
                    }
                  >
                    ← Change amount
                  </button>
                </div>
              )}
            </div>

            <div className="gift-card wish-card rv">
              <p className="gc-q">Or pick from our wishlist</p>
              <ul className="wishlist">
                {C.wishlist.map((w) => (
                  <li key={w.title}>
                    <span className="wl-emo">{w.emoji}</span>
                    <div>
                      <b>{w.title}</b>
                      <small>{w.note}</small>
                    </div>
                    <button
                      className="chip"
                      onClick={() => {
                        sprayGift(w.title);
                        document.querySelector(".spray-card")?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }}
                    >
                      Gift this
                    </button>
                  </li>
                ))}
              </ul>
              <p className="gc-foot">
                Coming in person? Your presence is more than enough. 🤍
              </p>
            </div>
          </div>
        </section>

        <footer className="farewell">
          <picture className="fw">
            <source media="(max-aspect-ratio: 3/4)" srcSet="img/couple.jpg" />
            <img src="img/hero-wide.jpg" alt="" aria-hidden="true" />
          </picture>
          <div className="farewell-wash" />
          <Sparkle count={30} />
          <div className="farewell-in rv">
            <p className="kicker light">See you in {C.city}</p>
            <p className="names-sm">
              {C.bride} <i>&amp;</i> {C.groom}
            </p>
            <p className="tagline">
              {C.dateShort} · {C.hashtag}
            </p>
          </div>
          <a className="made" href={C.madeBy} target="_blank" rel="noreferrer">
            Made with love by Eventlybuilt
          </a>
        </footer>
      </main>
    </>
  );
}
