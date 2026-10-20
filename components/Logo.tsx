// (가상) 한빛정밀 로고: '큰 빛(한빛)' — 파란 판 위의 해와 빛살 8줄. 글자(회사 이름)와 함께 쓰므로 그림은 읽지 않게 둔다.
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

export default function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="6" className="fill-accent" />
      {RAYS.map((d) => (
        <line
          key={d}
          x1="16"
          y1="7"
          x2="16"
          y2="4"
          className="stroke-white"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${d} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="5.5" className="fill-white" />
      <circle cx="16" cy="16" r="2" className="fill-accent" />
    </svg>
  );
}
