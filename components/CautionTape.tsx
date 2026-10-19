// 폴리스라인 테이프(그림 파일 없이 CSS 빗금). 살짝 기울이고 바깥은 잘라 390px에서 가로 스크롤이 없게.
export default function CautionTape({ text, tilt = "left" }: { text: string; tilt?: "left" | "right" }) {
  return (
    <div className="overflow-hidden py-2" aria-hidden="true">
      <div
        className={`caution-stripes -mx-6 flex justify-center gap-6 py-2 ${tilt === "left" ? "-rotate-1" : "rotate-1"}`}
      >
        <span className="bg-night px-3 py-0.5 text-sm font-black tracking-widest text-tape">{text}</span>
        <span className="hidden bg-night px-3 py-0.5 text-sm font-black tracking-widest text-tape md:inline">{text}</span>
      </div>
    </div>
  );
}
