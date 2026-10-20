import Link from "next/link";
import CautionTape from "@/components/CautionTape";
import GradeBadge from "@/components/GradeBadge";
import Mugshot from "@/components/Mugshot";
import { getBuyers } from "@/lib/buyers";
import { overdueTier, wanted } from "@/lib/metrics";
import { int, usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "수배" };

// 자유 퀘스트: C등급 바이어를 뒷골목 채권 회수 사무실의 현상수배 전단처럼.
// 웃음의 대상은 '떼인 돈'과 우리 쪽 처지 — 바이어를 겁주거나 욕하는 말은 쓰지 않는다. 숫자는 lib/metrics가 계산한 값만.
const TIER_NAME = ["숨 고르는 중", "잠수 시작", "장기 잠수", "전설의 잠수"] as const;

// 휴대폰은 1도까지만 기울인다(390px에서 가로 스크롤이 생기지 않게)
const TILT = ["-rotate-1", "rotate-1", "rotate-0", "rotate-1 sm:rotate-2", "-rotate-1 sm:-rotate-2"];

export default async function Page() {
  const buyers = await getBuyers();
  const { list, bountyTotal } = wanted(buyers);
  const legends = list.filter((b) => overdueTier(b.oldestOpenDays) === 3).length;

  return (
    <div className="overflow-hidden rounded-lg bg-night text-paper">
      <CautionTape text="채권 회수 현장 · 관계자 외 출입 금지" />

      <div className="space-y-8 px-4 pt-4 pb-6 sm:px-6">
        <header>
          <h1 className="text-3xl font-black tracking-wider text-tape sm:text-4xl">수배 게시판 {int(list.length)}곳</h1>
          <p className="mt-1 text-sm text-fog">기준: 2026-09-30 · (가상) 합성 데이터</p>
          <p className="mt-2 text-paper">
            웃자고 만든 쪽입니다 — 실제 독촉 문구가 아닙니다. 사무실 벽에는 C등급만 붙습니다.
          </p>
        </header>

        <section aria-label="벽 요약" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded border-2 border-siren p-4">
            <p className="text-sm text-fog">벽에 붙은 떼인 돈</p>
            <p className="num mt-1 text-3xl font-black text-siren">{usd(bountyTotal)}</p>
          </div>
          <div className="rounded border-2 border-tape p-4">
            <p className="text-sm text-fog">전설의 잠수(90일 넘게)</p>
            <p className="num mt-1 text-3xl font-black text-tape">{int(legends)}곳</p>
          </div>
          <div className="rounded border-2 border-fog p-4">
            <p className="text-sm text-fog">사장님 혈압</p>
            <p className="mt-1 text-3xl font-black text-paper">측정 불가</p>
          </div>
        </section>

        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b, i) => (
            <li key={b.id} className={TILT[i % TILT.length]}>
              <Link
                href={`/buyers/${b.id}`}
                className="torn relative block bg-paper px-4 pt-9 pb-8 text-center text-ink hover:bg-tape"
              >
                <span
                  className="absolute top-3 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-night bg-blood"
                  aria-hidden="true"
                />
                {i % 3 === 1 ? (
                  <svg
                    viewBox="0 0 100 100"
                    className="pointer-events-none absolute top-28 right-2 h-20 w-20 opacity-60"
                    aria-hidden="true"
                  >
                    <circle cx="50" cy="50" r="38" className="fill-none stroke-fog" strokeWidth="7" />
                    <circle cx="58" cy="44" r="30" className="fill-none stroke-fog" strokeWidth="2" />
                  </svg>
                ) : null}

                <span className="block text-4xl font-black tracking-widest">현상수배</span>
                <span className="mt-1 block text-sm font-black tracking-widest text-blood">갚든지 · 갚든지</span>

                <span className="mt-3 block border-2 border-night">
                  <Mugshot id={b.id} />
                </span>

                <span className="mt-3 block text-lg font-bold">{b.name}</span>
                <span className="mt-1 flex items-center justify-center gap-2 text-sm text-muted">
                  <span className="num">{b.id}</span>
                  <span>·</span>
                  <span>{b.countryKo}</span>
                  <GradeBadge grade={b.grade} />
                </span>

                <span className="mt-4 block text-sm font-semibold text-muted">떼인 돈</span>
                <span className="num block text-4xl font-black text-blood">{usd(b.overdueUsd)}</span>

                <span className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="bg-night px-2 py-0.5 font-black text-tape">{TIER_NAME[overdueTier(b.oldestOpenDays)]}</span>
                  <span>
                    밀린 지 <span className="num font-bold">{int(b.oldestOpenDays)}일</span>째
                  </span>
                </span>

                <span className="mt-3 block text-sm text-muted">목격 정보: {b.signals[0] ?? "—"}</span>
                <span className="mt-4 flex min-h-11 items-center justify-center bg-night text-sm font-black tracking-wider text-tape">
                  신상 보러 가기
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-sm text-fog">전단의 신호는 확인해 볼 이유이지, 연체의 원인이라는 뜻은 아닙니다.</p>
      </div>

      <CautionTape text="떼인 돈 회수 중 · 사장님 출입 금지" tilt="right" />
    </div>
  );
}
