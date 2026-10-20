// 확인 기록 상태 배지: 색 + 글자(색만으로 구분하지 않는다). 상세 쪽 · 첫 화면이 함께 쓴다.
const STYLE: Record<string, string> = {
  "확인 필요": "border-warn text-warn",
  "확인 완료": "border-accent text-accent",
  보류: "border-line text-muted",
};

export default function ReviewStatusBadge({ status }: { status: string }) {
  const style = STYLE[status] ?? "border-line text-muted";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
}
