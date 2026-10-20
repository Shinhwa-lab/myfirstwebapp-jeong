import ReviewStatusBadge from "@/components/ReviewStatusBadge";

// 확인 기록 목록 — 상세 쪽 · 금고 쪽이 함께 쓴다. 시각(at)은 서버에서 kst()로 만든 글자를 받는다.
export type ReviewRow = { id: number; status: string; memo: string; reviewer: string; at: string };

export default function ReviewList({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) return <p className="text-muted">아직 확인 기록이 없습니다</p>;
  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-bg">
      {reviews.map((r) => (
        <li key={r.id} className="space-y-1 p-3">
          <ReviewStatusBadge status={r.status} />
          <p className="whitespace-pre-line text-ink">{r.memo}</p>
          <p className="text-sm text-muted">
            {r.reviewer} · <span className="num">{r.at}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
