import { db } from "@/lib/db";

// 확인 기록 읽기 — Supabase DB의 Review 표. 서버에서만 부른다. 최신이 위(같은 시각이면 나중에 쓴 것이 위).
const NEWEST_FIRST = [{ createdAt: "desc" as const }, { id: "desc" as const }];

export async function getReviews(buyerId: string, take = 20) {
  return db().review.findMany({ where: { buyerId }, orderBy: NEWEST_FIRST, take });
}

export async function getRecentReviews(take = 5) {
  return db().review.findMany({
    orderBy: NEWEST_FIRST,
    take,
    include: { buyer: { select: { name: true } } },
  });
}
