import { ImageResponse } from "next/og";

// 브라우저 탭 아이콘 — components/Logo.tsx와 같은 그림. ImageResponse에는 Tailwind 클래스가 없어
// globals.css @theme 토큰 값을 그대로 쓴다(accent #1f5fbf · 흰색).
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const ACCENT = "#1f5fbf";
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="6" fill={ACCENT} />
        {RAYS.map((d) => (
          <line
            key={d}
            x1="16"
            y1="7"
            x2="16"
            y2="4"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${d} 16 16)`}
          />
        ))}
        <circle cx="16" cy="16" r="5.5" fill="#ffffff" />
        <circle cx="16" cy="16" r="2" fill={ACCENT} />
      </svg>
    ),
    { ...size },
  );
}
