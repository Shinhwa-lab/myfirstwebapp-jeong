import Link from "next/link";
import BarRow from "@/components/BarRow";
import DataTable, { type Column } from "@/components/DataTable";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { getBuyers, type Buyer } from "@/lib/buyers";
import { byRegion, filterByGrade, gradeCounts, isGrade, kpis, topRisk } from "@/lib/metrics";
import { int, pct, usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "바이어" };

function BuyerLink({ buyer, rank }: { buyer: Buyer; rank?: number }) {
  return (
    <span className="block">
      <Link href={`/buyers/${buyer.id}`} className="text-accent underline-offset-2 hover:underline">
        {rank ? `${rank}. ` : ""}
        {buyer.name}
      </Link>
      <span className="num block text-xs font-normal text-muted">{buyer.id}</span>
    </span>
  );
}

const LIST_COLUMNS: Column[] = [
  { key: "buyer", label: "바이어" },
  { key: "country", label: "나라" },
  { key: "grade", label: "등급" },
  { key: "pd", label: "위험 점수", align: "right" },
  { key: "ar", label: "채권", align: "right" },
  { key: "overdue", label: "연체", align: "right" },
];

const TOP_COLUMNS: Column[] = [...LIST_COLUMNS, { key: "signal", label: "첫 신호" }];

function row(b: Buyer, rank?: number) {
  return {
    buyer: <BuyerLink buyer={b} rank={rank} />,
    country: b.countryKo,
    grade: <GradeBadge grade={b.grade} />,
    pd: pct(b.pd30d),
    ar: usd(b.openArUsd),
    overdue: usd(b.overdueUsd),
    signal: b.signals[0] ?? "—",
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ grade?: string | string[] }> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.grade) ? sp.grade[0] : sp.grade;
  const grade = isGrade(raw) ? raw : null;

  const buyers = await getBuyers();
  const k = kpis(buyers);
  const counts = gradeCounts(buyers);
  const top = topRisk(buyers, 10);
  const regions = byRegion(buyers);
  const maxAr = Math.max(0, ...regions.map((r) => r.ar));
  const maxShare = Math.max(...regions.map((r) => r.shareC ?? -1));
  const list = filterByGrade(buyers, grade);

  const chips = [
    { key: "all", label: `전체 ${int(k.count)}`, href: "/buyers", current: grade === null },
    ...counts.map((c) => ({
      key: c.grade,
      label: `${c.grade} ${int(c.count)}`,
      href: `/buyers?grade=${c.grade}`,
      current: grade === c.grade,
    })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`바이어 ${int(k.count)}곳`}
        asof="2026-09-30 · (가상) 합성 데이터"
        line="위험 점수는 판단을 돕는 값이고, 결정은 사람이 합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="위험 바이어(C등급)" value={`${int(k.countC)}곳`} />
        <KpiCard label="C등급 채권" value={usd(k.arC)} sub={`전체의 ${pct(k.shareC)}`} />
        <KpiCard label="전체 채권" value={usd(k.arTotal)} sub={`${int(k.count)}곳`} />
        <KpiCard label="연체 금액" value={usd(k.overdueTotal)} sub={`${int(k.overdueCount)}곳`} />
      </section>

      <section aria-labelledby="top-risk" className="space-y-3">
        <h2 id="top-risk" className="text-lg font-semibold text-ink">
          위험 상위 10
        </h2>
        <DataTable columns={TOP_COLUMNS} rows={top.map((b, i) => row(b, i + 1))} caption="위험 점수가 큰 순 10곳" />
      </section>

      <section aria-labelledby="by-region" className="space-y-3">
        <h2 id="by-region" className="text-lg font-semibold text-ink">
          지역별 채권
        </h2>
        <div className="space-y-2">
          {regions.map((r) => {
            const strong = r.shareC !== null && r.shareC === maxShare;
            return (
              <div key={r.region}>
                <BarRow label={r.region} value={r.ar} max={maxAr} display={usd(r.ar)} strong={strong} />
                <p className={`num text-right text-xs ${strong ? "font-semibold text-warn" : "text-muted"}`}>
                  C등급 {usd(r.arC)} · {pct(r.shareC)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="all-buyers" className="space-y-3">
        <h2 id="all-buyers" className="text-lg font-semibold text-ink">
          전체 목록
        </h2>
        <nav aria-label="등급으로 거르기">
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.key}>
                <Link
                  href={c.href}
                  aria-current={c.current ? "page" : undefined}
                  className={`num flex min-h-11 items-center rounded-md border px-4 text-sm ${
                    c.current ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
                  }`}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted">{grade ? `${grade}등급 ${int(list.length)}곳` : `전체 ${int(list.length)}곳`}</p>
        <DataTable columns={LIST_COLUMNS} rows={list.map((b) => row(b))} caption="바이어 목록" />
      </section>
    </div>
  );
}
