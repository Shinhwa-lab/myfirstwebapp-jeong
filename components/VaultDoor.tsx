"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Notice from "@/components/Notice";

// 다이얼 금고 문(자유 퀘스트): 번호를 넣고 돌리면 '딸깍딸깍' → '철컥' → 문이 열린다.
// 문 안쪽(children)은 서버가 그 바이어 하나의 기록만 만들어 넘긴다. 소리는 단추를 눌렀을 때만 난다.
const SPIN_MS = 900;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function dialSound() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;

    // 딸깍딸깍: 짧고 높은 소리 여러 번(갈수록 느리게)
    let t = t0;
    for (let i = 0; i < 10; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 2200 - i * 60;
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
      t += 0.05 + i * 0.008;
    }

    // 철컥: 낮게 떨어지는 소리 + 짧은 쇳소리
    const at = t0 + SPIN_MS / 1000 - 0.05;
    const low = ctx.createOscillator();
    const lg = ctx.createGain();
    low.type = "sine";
    low.frequency.setValueAtTime(140, at);
    low.frequency.exponentialRampToValueAtTime(40, at + 0.25);
    lg.gain.setValueAtTime(0.9, at);
    lg.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
    low.connect(lg).connect(ctx.destination);
    low.start(at);
    low.stop(at + 0.32);

    const metal = ctx.createOscillator();
    const mg = ctx.createGain();
    metal.type = "triangle";
    metal.frequency.value = 820;
    mg.gain.setValueAtTime(0.25, at);
    mg.gain.exponentialRampToValueAtTime(0.001, at + 0.12);
    metal.connect(mg).connect(ctx.destination);
    metal.start(at);
    metal.stop(at + 0.13);

    low.onended = () => void ctx.close();
  } catch {
    // 소리가 안 나는 브라우저 — 문은 그대로 열린다
  }
}

// 다이얼 눈금(고정 값 — 서버와 브라우저가 같은 그림)
const TICKS = Array.from({ length: 40 }, (_, i) => i * 9);
const NUMBERS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
const BOLTS = [
  [22, 22], [178, 22], [22, 178], [178, 178], [22, 100], [178, 100], [100, 22], [100, 178],
];

function DoorArt({ angle, spinning }: { angle: number; spinning: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="mx-auto block w-full max-w-xs" aria-hidden="true">
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
          <text
            key={n}
            x="100"
            y="76"
            textAnchor="middle"
            fontSize="7"
            className="fill-paper"
            transform={`rotate(${i * 36} 100 108)`}
          >
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
  const [code, setCode] = useState(missing ?? "");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [hint, setHint] = useState("");
  const [navigating, startTransition] = useTransition();
  const busy = spinning || navigating;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = code.trim().toUpperCase();
    if (!id) {
      setHint("바이어 번호를 적어 주세요(예: B048)");
      return;
    }
    setHint("");
    dialSound();
    const go = () => startTransition(() => router.push(`/vault?id=${encodeURIComponent(id)}`));
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
  }

  if (openedId) {
    return (
      <section aria-label="열린 금고" className="vault-stage relative overflow-hidden rounded-lg bg-night p-4">
        <p className="sr-only" aria-live="polite">
          금고가 열렸습니다 — {openedId} {openedName}
        </p>
        <div className="vault-reveal">{children}</div>
        <div aria-hidden="true" className="vault-swing pointer-events-none absolute inset-0 flex items-center justify-center bg-night p-4">
          <DoorArt angle={0} spinning={false} />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="닫힌 금고" className="space-y-4 rounded-lg bg-night p-4 text-paper">
      <div key={missing ?? "closed"} className={missing ? "vault-rattle" : undefined}>
        <DoorArt angle={angle} spinning={spinning} />
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-xs space-y-3">
        <label htmlFor="vault-code" className="block text-sm font-semibold text-paper">
          바이어 번호
        </label>
        <input
          id="vault-code"
          name="id"
          type="text"
          inputMode="text"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="예: B048"
          className="num block min-h-11 w-full rounded-md border border-fog bg-paper px-3 text-base text-ink uppercase"
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full rounded-md bg-tape px-4 font-black tracking-wider text-night disabled:opacity-60"
        >
          {busy ? "다이얼 도는 중…" : "다이얼 돌려 열기"}
        </button>
      </form>

      {hint ? <Notice tone="warn" title={hint} /> : null}
      {missing && !hint ? <Notice tone="warn" title="바이어를 찾을 수 없습니다 — 번호를 확인해 주세요" /> : null}
      <p className="text-center text-xs text-fog">소리는 단추를 눌렀을 때만 납니다. 번호는 어디에도 보내지 않고 이 앱 안에서만 찾습니다.</p>
    </section>
  );
}
