import { db } from "@/lib/db";

// 바이어 데이터 — Supabase DB의 Buyer 표에서 읽는다(5일차부터). 서버에서만 부른다.
export type Grade = "S" | "A" | "B" | "C";

export type Buyer = {
  id: string;
  name: string;
  countryCode: string;
  countryKo: string;
  region: string;
  industry: string;
  paymentMethod: string;
  termsDays: number;
  openArUsd: number;
  overdueUsd: number;
  /** 31일 넘긴 채권 비중(0–1), 없으면 null */
  pctAr31p: number | null;
  oldestOpenDays: number;
  /** 최근 1년 평균 지연 일수, 없으면 null */
  avgDaysLate12m: number | null;
  /** 위험 점수(0–1) */
  pd30d: number;
  grade: Grade;
  signals: string[];
};

// DB의 grade 칸은 String이라, 화면 · 계산이 쓰는 Grade 형으로 맞춰 돌려준다(값은 그대로).
export async function getBuyers(): Promise<Buyer[]> {
  const rows = await db().buyer.findMany({ orderBy: { id: "asc" } });
  return rows as Buyer[];
}

export async function getBuyer(id: string): Promise<Buyer | null> {
  const row = await db().buyer.findUnique({ where: { id: id.trim().toUpperCase() } });
  return row as Buyer | null;
}
