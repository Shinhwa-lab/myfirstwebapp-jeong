// 머그샷 그림(손으로 쓴 SVG · 그림 파일 없음): 키 눈금 · 실루엣 · 번호판.
// 꾸밈(선글라스 · 모자 · 콧수염 · 물음표)은 id 숫자로 정해서 새로 고쳐도 같은 그림이 나온다.
export default function Mugshot({ id }: { id: string }) {
  const n = Number(id.replace(/\D/g, "")) || 0;
  const look = n % 4;
  const marks = [190, 180, 170, 160, 150];

  return (
    <svg viewBox="0 0 240 180" className="block h-auto w-full" role="img" aria-label={`${id} 머그샷 그림`}>
      <rect width="240" height="180" className="fill-fog" />
      {marks.map((m, i) => (
        <g key={m}>
          <line x1="0" x2="240" y1={18 + i * 28} y2={18 + i * 28} className="stroke-night" strokeWidth="1" opacity="0.5" />
          <text x="6" y={14 + i * 28} fontSize="10" fontWeight="700" className="fill-night">
            {m}
          </text>
        </g>
      ))}

      <path d="M44 180 Q56 122 120 118 Q184 122 196 180 Z" className="fill-night" />
      <rect x="106" y="98" width="28" height="26" className="fill-night" />
      <ellipse cx="120" cy="70" rx="33" ry="39" className="fill-night" />

      {look === 0 ? (
        <text x="120" y="84" textAnchor="middle" fontSize="40" fontWeight="900" className="fill-fog">
          ?
        </text>
      ) : null}
      {look === 1 ? (
        <g className="fill-tape">
          <rect x="94" y="60" width="22" height="11" rx="3" />
          <rect x="124" y="60" width="22" height="11" rx="3" />
          <rect x="114" y="63" width="12" height="3" />
        </g>
      ) : null}
      {look === 2 ? (
        <g className="fill-blood">
          <path d="M84 52 Q120 14 156 52 Z" />
          <rect x="80" y="48" width="96" height="8" rx="3" />
        </g>
      ) : null}
      {look === 3 ? <path d="M98 88 Q110 80 120 88 Q130 80 142 88 Q130 96 120 91 Q110 96 98 88 Z" className="fill-fog" /> : null}

      <rect x="74" y="132" width="92" height="38" rx="2" className="fill-night stroke-paper" strokeWidth="2" />
      <text x="120" y="145" textAnchor="middle" fontSize="8" fontWeight="700" className="fill-paper">
        한빛정밀 채권과
      </text>
      <text x="120" y="164" textAnchor="middle" fontSize="18" fontWeight="900" className="fill-tape">
        {id}
      </text>
    </svg>
  );
}
