import type { Buyer, Grade } from "@/lib/buyers";

// 계산만 한다(순수 함수) — 화면 글자는 만들지 않는다. 등급은 grade 칸 그대로(pd30d로 다시 매기지 않는다).
export const GRADES: Grade[] = ["S", "A", "B", "C"];

const sumAr = (list: Buyer[]) => list.reduce((s, b) => s + b.openArUsd, 0);

export function kpis(buyers: Buyer[]) {
  const gradeC = buyers.filter((b) => b.grade === "C");
  const overdue = buyers.filter((b) => b.overdueUsd > 0);
  const arTotal = sumAr(buyers);
  const arC = sumAr(gradeC);
  return {
    countC: gradeC.length,
    arC,
    shareC: arTotal > 0 ? arC / arTotal : null,
    arTotal,
    count: buyers.length,
    overdueTotal: buyers.reduce((s, b) => s + b.overdueUsd, 0),
    overdueCount: overdue.length,
  };
}

export function gradeCounts(buyers: Buyer[]): { grade: Grade; count: number }[] {
  return GRADES.map((grade) => ({ grade, count: buyers.filter((b) => b.grade === grade).length }));
}

function byRisk(a: Buyer, b: Buyer) {
  if (b.pd30d !== a.pd30d) return b.pd30d - a.pd30d;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function topRisk(buyers: Buyer[], n = 10): Buyer[] {
  return [...buyers].sort(byRisk).slice(0, n);
}

export function byRegion(buyers: Buyer[]) {
  const map = new Map<string, Buyer[]>();
  for (const b of buyers) map.set(b.region, [...(map.get(b.region) ?? []), b]);
  return [...map.entries()]
    .map(([region, list]) => {
      const ar = sumAr(list);
      const arC = sumAr(list.filter((b) => b.grade === "C"));
      return { region, count: list.length, ar, arC, shareC: ar > 0 ? arC / ar : null };
    })
    .sort((a, b) => b.ar - a.ar);
}

// 수배 게시판(/wanted): C등급만, 연체 금액이 큰 순 · 같으면 id 순, 그리고 연체 합계
export function wanted(buyers: Buyer[]) {
  const list = buyers
    .filter((b) => b.grade === "C")
    .sort((a, b) => b.overdueUsd - a.overdueUsd || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { list, bountyTotal: list.reduce((s, b) => s + b.overdueUsd, 0) };
}

// 밀린 일수 단계: 3 = 90일 이상 · 2 = 60일 이상 · 1 = 30일 이상 · 0 = 그 아래(이름 붙이기는 화면에서)
export function overdueTier(oldestOpenDays: number): 0 | 1 | 2 | 3 {
  if (oldestOpenDays >= 90) return 3;
  if (oldestOpenDays >= 60) return 2;
  if (oldestOpenDays >= 30) return 1;
  return 0;
}

export function isGrade(v: unknown): v is Grade {
  return typeof v === "string" && (GRADES as string[]).includes(v);
}

export function filterByGrade(buyers: Buyer[], grade?: string | null): Buyer[] {
  const list = isGrade(grade) ? buyers.filter((b) => b.grade === grade) : buyers;
  return [...list].sort(byRisk);
}
