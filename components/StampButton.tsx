"use client";

import { useState } from "react";
import CautionTape from "@/components/CautionTape";

// 독촉 도장(자유 퀘스트): 누르면 도장이 쾅 — 화면 흔들림 · 잉크 튐 · 소리(Web Audio) · 진동(되는 기기만).
// 값은 서버에서 형식을 맞춘 글자만 받는다. 소리는 단추를 눌렀을 때만 나고, 아무것도 저장하거나 보내지 않는다.
function boomSound() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t = ctx.currentTime;

    // 쿵: 낮게 떨어지는 사인파
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.3);
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);

    // 지직: 짧은 잡음(도장 고무가 종이에 눌리는 소리)
    const len = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const noise = ctx.createBufferSource();
    const band = ctx.createBiquadFilter();
    const ng = ctx.createGain();
    noise.buffer = buf;
    band.type = "bandpass";
    band.frequency.value = 1800;
    ng.gain.value = 0.5;
    noise.connect(band).connect(ng).connect(ctx.destination);
    noise.start(t + 0.02);

    osc.onended = () => void ctx.close();
  } catch {
    // 소리가 안 나는 브라우저 — 도장은 그대로 찍힌다
  }
}

function shakeScreen() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const html = document.documentElement;
  html.classList.remove("shaking");
  void html.offsetWidth; // 애니메이션을 처음부터 다시
  html.classList.add("shaking");
  window.setTimeout(() => html.classList.remove("shaking"), 450);
}

// 잉크 방울 자리(고정 값 — 서버와 브라우저가 같은 그림)
const DROPS = [
  [18, 30, 9], [82, 22, 6], [12, 74, 5], [88, 70, 10], [30, 12, 4], [70, 88, 5], [50, 6, 3], [6, 50, 4], [94, 46, 3],
];

export default function StampButton({ overdue, days, clean }: { overdue: string; days: string; clean: boolean }) {
  const [stamped, setStamped] = useState(false);
  const [round, setRound] = useState(0);

  function press() {
    if (stamped) {
      setStamped(false);
      return;
    }
    setRound((r) => r + 1);
    setStamped(true);
    boomSound();
    shakeScreen();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([80, 40, 160]);
  }

  return (
    <section aria-labelledby="stamp" className="space-y-3">
      <h2 id="stamp" className="text-lg font-semibold text-ink">
        독촉 도장
      </h2>
      <div className="overflow-hidden rounded-lg bg-night">
        <CautionTape text={clean ? "오늘은 조용함" : "독촉 집행 구역"} />
        <div className="relative flex min-h-56 items-center justify-center p-4">
          {stamped ? (
            <div key={round} className="relative">
              {clean ? null : (
                <svg viewBox="0 0 100 100" className="splat-in pointer-events-none absolute -inset-10" aria-hidden="true">
                  {DROPS.map(([x, y, r]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="fill-siren" opacity="0.75" />
                  ))}
                </svg>
              )}
              <div
                className={`stamp-in relative rounded-lg border-8 px-6 py-3 text-center ${
                  clean ? "border-tape text-tape" : "border-siren text-siren"
                }`}
              >
                <p className="text-6xl font-black tracking-widest">{clean ? "보류" : "독촉"}</p>
                <p className="num mt-1 text-sm font-black">연체 {overdue}</p>
                <p className="num text-sm font-black">{clean ? "이번엔 봐줌" : `밀린 지 ${days}`}</p>
              </div>
              <svg viewBox="0 0 100 100" className="boom-in pointer-events-none absolute -top-10 -right-12 h-20 w-20" aria-hidden="true">
                <polygon
                  points="50,2 61,30 92,18 72,44 98,58 66,64 74,96 50,74 26,96 34,64 2,58 28,44 8,18 39,30"
                  className="fill-tape stroke-night"
                  strokeWidth="3"
                />
                <text x="50" y="60" textAnchor="middle" fontSize="24" fontWeight="900" className="fill-night">
                  {clean ? "휴" : "쾅!"}
                </text>
              </svg>
            </div>
          ) : (
            <p className="text-sm text-fog">아직 도장을 안 찍었습니다. 사장님이 지켜보고 있습니다.</p>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {stamped ? `${clean ? "보류" : "독촉"} 도장을 찍었습니다. 연체 ${overdue}` : ""}
      </p>
      <button
        type="button"
        onClick={press}
        className={`min-h-11 rounded-md px-5 font-black tracking-wider ${
          stamped ? "border border-line bg-bg text-ink" : "bg-blood text-white"
        }`}
      >
        {stamped ? "도장 지우기" : "독촉 도장 쾅"}
      </button>
      <p className="text-xs text-muted">웃자고 만든 단추입니다 — 아무에게도 보내지 않습니다. 소리 · 진동은 되는 기기에서만.</p>
    </section>
  );
}
