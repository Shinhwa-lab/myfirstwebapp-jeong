"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// 다이얼 금고 문(자유 퀘스트): 숫자 버튼판으로 B___ 세 자리를 누르면 → 확인 중(다이얼 딸깍딸깍) →
// 맞으면 초록 불 · 철컥 · 문이 열리며 안으로 들어간다 / 틀리면 빨간 불 · 삐-익 · 덜컹.
// 번호가 맞는지는 서버가 DB에서 찾는다(바이어 목록은 브라우저로 보내지 않는다). 소리는 사람이 누른 뒤에만 난다.
const SPIN_MS = 900;
const DIGITS = 3;

type Phase = "idle" | "checking" | "open" | "bad";

const LIGHT: Record<Phase, { dot: string; label: string }> = {
  idle: { dot: "bg-fog", label: "대기" },
  checking: { dot: "bg-tape vault-blink", label: "확인 중" },
  open: { dot: "bg-grade-s", label: "열림" },
  bad: { dot: "bg-siren", label: "없는 번호" },
};

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// ---- 소리(Web Audio) — 안 되는 브라우저에서는 조용히 넘어간다 ----
let sharedCtx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!sharedCtx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      sharedCtx = new Ctx();
    }
    if (sharedCtx.state === "suspended") void sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

function tone(type: OscillatorType, freq: number, start: number, dur: number, vol: number, endFreq?: number) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

const keyBeep = () => tone("sine", 1400, 0, 0.07, 0.25);

function dialClicks() {
  let t = 0;
  for (let i = 0; i < 10; i++) {
    tone("square", 2200 - i * 60, t, 0.025, 0.15);
    t += 0.05 + i * 0.008;
  }
}

function okSound() {
  tone("sine", 1600, 0, 0.08, 0.3);
  tone("sine", 2100, 0.11, 0.1, 0.3);
  tone("sine", 140, 0.3, 0.28, 0.9, 40); // 철컥(낮게)
  tone("triangle", 820, 0.3, 0.12, 0.25); // 철컥(쇳소리)
}

const badSound = () => tone("square", 220, 0, 0.45, 0.2, 180);

// ---- 그림 ----
const TICKS = Array.from({ length: 40 }, (_, i) => i * 9);
const NUMBERS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
const BOLTS = [
  [22, 22], [178, 22], [22, 178], [178, 178], [22, 100], [178, 100], [100, 22], [100, 178],
];

function DoorArt({ angle, spinning }: { angle: number; spinning: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="mx-auto block w-full max-w-60 sm:max-w-xs" aria-hidden="true">
      <rect x="4" y="4" width="192" height="192" rx="14" className="fill-muted stroke-fog" strokeWidth="3" />
      <rect x="14" y="14" width="172" height="172" rx="10" className="fill-night stroke-fog" strokeWidth="1.5" opacity="0.55" />
      {BOLTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5" className="fill-fog stroke-night" strokeWidth="1.5" />
      ))}
      <rect x="66" y="30" width="68" height="14" rx="2" className="fill-tape" />
      <text x="100" y="40.5" textAnchor="middle" fontSize="9" fontWeight="900" className="fill-night">
        한빛정밀 금고
      </text>
      <circle cx="100" cy="108" r="54" className="fill-night stroke-fog" strokeWidth="4" />
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: "100px 108px",
          transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.3, 0.1, 0.2, 1)` : "none",
        }}
      >
        {TICKS.map((d) => (
          <line
            key={d}
            x1="100"
            y1="58"
            x2="100"
            y2={d % 36 === 0 ? 66 : 62}
            className="stroke-paper"
            strokeWidth={d % 36 === 0 ? 2 : 1}
            transform={`rotate(${d} 100 108)`}
          />
        ))}
        {NUMBERS.map((n, i) => (
          <text key={n} x="100" y="76" textAnchor="middle" fontSize="7" className="fill-paper" transform={`rotate(${i * 36} 100 108)`}>
            {n}
          </text>
        ))}
        <circle cx="100" cy="108" r="22" className="fill-muted stroke-fog" strokeWidth="2" />
        <rect x="96" y="80" width="8" height="56" rx="3" className="fill-fog" />
        <rect x="72" y="104" width="56" height="8" rx="3" className="fill-fog" />
        <circle cx="100" cy="108" r="6" className="fill-tape" />
      </g>
      <polygon points="100,50 95,42 105,42" className="fill-tape" />
    </svg>
  );
}

// 작은 화면: B _ _ _ (또는 안내 글) + 불빛
function Display({ digits, phase, message }: { digits: string; phase: Phase; message: string }) {
  const slots = Array.from({ length: DIGITS }, (_, i) => digits[i] ?? "_");
  const light = LIGHT[phase];
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-fog bg-night px-4">
      <p className="num text-2xl font-black tracking-widest text-tape" aria-hidden="true">
        {message || `B ${slots.join(" ")}`}
      </p>
      <p className="flex items-center gap-2 text-xs text-fog">
        <span className={`inline-block h-3 w-3 rounded-full ${light.dot}`} aria-hidden="true" />
        {light.label}
      </p>
    </div>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "지움", "0", "열기"] as const;

function Keypad({ onKey, disabled }: { onKey?: (k: string) => void; disabled: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="금고 번호 버튼판">
      {KEYS.map((k) => {
        const action = k === "열기";
        const erase = k === "지움";
        return (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => onKey?.(k)}
            aria-label={action ? "열기" : erase ? "한 자리 지움" : `숫자 ${k}`}
            className={`vault-key min-h-14 rounded-md font-black disabled:opacity-60 ${
              action
                ? "bg-tape text-lg text-night"
                : erase
                  ? "border border-fog bg-night text-base text-paper"
                  : "num bg-fog text-2xl text-night"
            }`}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

export default function VaultDoor({
  openedId,
  openedName,
  missing,
  children,
}: {
  openedId: string | null;
  openedName: string | null;
  missing: string | null;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [phase, setPhase] = useState<Phase>(missing ? "bad" : "idle");
  const [message, setMessage] = useState(missing ? "없는 번호" : "");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [navigating, startTransition] = useTransition();
  const timer = useRef<number | null>(null);
  const busy = phase === "checking" || spinning || navigating;

  // 화면에 잠깐 글을 띄웠다가 대기로 돌아간다
  const flash = useCallback((text: string, ms = 1300) => {
    setPhase("bad");
    setMessage(text);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPhase("idle");
      setMessage("");
    }, ms);
  }, []);

  // 열림 · 없는 번호로 막 도착했을 때의 소리(쪽 안에서 이미 눌렀으므로 브라우저가 허락한다)
  useEffect(() => {
    if (openedId) okSound();
    else if (missing) {
      badSound();
      timer.current = window.setTimeout(() => {
        setPhase("idle");
        setMessage("");
      }, 1500);
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [openedId, missing]);

  const submit = useCallback(() => {
    if (digits.length < DIGITS) {
      badSound();
      flash("세 자리");
      return;
    }
    const id = `B${digits}`;
    if (timer.current) window.clearTimeout(timer.current);
    setMessage("");
    setPhase("checking");
    dialClicks();
    const go = () => startTransition(() => router.push(`/vault?id=${id}`));
    if (reducedMotion()) {
      go();
      return;
    }
    setSpinning(true);
    setAngle((a) => a + 990);
    window.setTimeout(() => {
      setSpinning(false);
      go();
    }, SPIN_MS);
  }, [digits, flash, router]);

  const press = useCallback(
    (k: string) => {
      if (busy) return;
      if (k === "열기") return submit();
      keyBeep();
      if (phase === "bad") {
        setPhase("idle");
        setMessage("");
      }
      if (k === "지움") return setDigits((d) => d.slice(0, -1));
      setDigits((d) => (d.length < DIGITS ? d + k : d));
    },
    [busy, phase, submit],
  );

  // PC: 키보드 숫자 · Backspace · Enter도 버튼처럼
  useEffect(() => {
    if (openedId) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("지움");
      else if (e.key === "Enter") press("열기");
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openedId, press]);

  if (openedId) {
    return (
      <section aria-label="열린 금고" className="vault-stage relative min-h-160 overflow-hidden rounded-lg bg-night p-4">
        <p className="sr-only" aria-live="polite">
          금고가 열렸습니다 — {openedId} {openedName}
        </p>
        <div className="vault-enter">{children}</div>
        <div aria-hidden="true" className="vault-swing pointer-events-none absolute inset-0 space-y-4 bg-night p-4">
          <DoorArt angle={990} spinning={false} />
          <div className="mx-auto max-w-xs space-y-3">
            <Display digits={openedId.slice(1)} phase="open" message="" />
            <Keypad disabled />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="닫힌 금고" className="space-y-4 rounded-lg bg-night p-4 text-paper">
      <div key={missing ?? "closed"} className={missing ? "vault-rattle" : undefined}>
        <DoorArt angle={angle} spinning={spinning} />
      </div>

      <div className="mx-auto max-w-xs space-y-3">
        <Display digits={digits} phase={phase} message={message} />
        <p className="sr-only" aria-live="polite">
          {message ? (message === "없는 번호" ? "바이어를 찾을 수 없습니다 — 번호를 확인해 주세요" : "세 자리를 눌러 주세요") : `입력한 번호 B${digits}`}
        </p>
        <Keypad onKey={press} disabled={busy} />
      </div>

      <p className="text-center text-xs text-fog">
        바이어 번호 B 뒤의 세 자리(예: 0 4 8)를 누르고 열기. PC는 키보드 숫자 · Enter도 됩니다. 소리는 누를 때만 납니다.
      </p>
    </section>
  );
}
