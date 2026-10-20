import Link from "next/link";
import GradeBadge from "@/components/GradeBadge";
import PageHeader from "@/components/PageHeader";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";
import VaultDoor from "@/components/VaultDoor";
import { getBuyer } from "@/lib/buyers";
import { kst, usd } from "@/lib/format";
import { getReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export const metadata = { title: "금고" };

// 자유 퀘스트: 다이얼 금고 — 번호를 맞추면 그 바이어의 확인 기록 칸이 열린다. 기록은 Supabase DB(같은 금고)에서 읽고 쓴다.
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const sp = await searchParams;
  const raw = (Array.isArray(sp.id) ? sp.id[0] : sp.id)?.trim() ?? "";
  const buyer = raw ? await getBuyer(raw) : null;
  const reviews = buyer ? (await getReviews(buyer.id)).map((r) => ({ ...r, at: kst(r.createdAt) })) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="금고"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="바이어 번호를 넣고 다이얼을 돌리면 금고가 열립니다. 안에서 확인 기록을 보고 남길 수 있습니다."
      />

      <VaultDoor
        key={buyer?.id ?? (raw || "closed")}
        openedId={buyer?.id ?? null}
        openedName={buyer?.name ?? null}
        missing={raw && !buyer ? raw.toUpperCase() : null}
      >
        {buyer ? (
          <div className="space-y-4 rounded-lg bg-paper p-4 text-ink">
            <div className="flex flex-wrap items-center gap-2">
              <span className="num text-sm text-muted">{buyer.id}</span>
              <GradeBadge grade={buyer.grade} />
            </div>
            <h2 className="text-xl font-semibold text-ink">{buyer.name}</h2>
            <p className="text-sm text-muted">
              연체 <span className="num">{usd(buyer.overdueUsd)}</span> · 가장 오래 밀린 인보이스{" "}
              <span className="num">{buyer.oldestOpenDays}일</span>
            </p>

            <section aria-labelledby="vault-reviews" className="space-y-3">
              <h3 id="vault-reviews" className="font-semibold text-ink">
                금고 속 확인 기록
              </h3>
              <ReviewList reviews={reviews} />
            </section>

            <ReviewForm buyerId={buyer.id} />

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/buyers/${buyer.id}`}
                className="inline-flex min-h-11 items-center rounded-md border border-line bg-bg px-4 text-accent"
              >
                상세 쪽으로
              </Link>
              <Link href="/vault" className="inline-flex min-h-11 items-center rounded-md border border-line bg-bg px-4 text-ink">
                문 닫기
              </Link>
            </div>
          </div>
        ) : null}
      </VaultDoor>
    </div>
  );
}
