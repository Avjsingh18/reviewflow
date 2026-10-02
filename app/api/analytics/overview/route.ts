import { NextRequest, NextResponse } from "next/server";
import { error, requireUser } from "@/lib/api";

function days(request: NextRequest) { const end = new Date(); const start = new Date(end); start.setUTCDate(start.getUTCDate() - 29); return { start: request.nextUrl.searchParams.get("start") || start.toISOString().slice(0, 10), end: request.nextUrl.searchParams.get("end") || end.toISOString().slice(0, 10) }; }
export async function GET(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const { start, end } = days(request);
  const { data: business } = await auth.supabase.from("businesses").select("id").eq("user_id", auth.user.id).maybeSingle(); if (!business) return error("Business not found.", 404);
  const { data: snapshots } = await auth.supabase.from("review_snapshots").select("rating,total_reviews,snapshot_date").eq("business_id", business.id).lte("snapshot_date", end).order("snapshot_date", { ascending: true });
  const history = snapshots || []; const beforeStart = history.filter(x => x.snapshot_date <= start).at(-1); const latest = history.at(-1);
  const { data: qr } = await auth.supabase.from("qr_codes").select("id").eq("business_id", business.id).eq("active", true).maybeSingle();
  const { count } = qr ? await auth.supabase.from("qr_scans").select("id", { count: "exact", head: true }).eq("qr_code_id", qr.id).gte("scanned_at", `${start}T00:00:00.000Z`).lte("scanned_at", `${end}T23:59:59.999Z`) : { count: 0 };
  return NextResponse.json({ rating: latest?.rating ?? null, totalReviews: latest?.total_reviews ?? null, newReviews: latest && beforeStart ? latest.total_reviews - beforeStart.total_reviews : null, ratingChange: latest && beforeStart ? Number((latest.rating - beforeStart.rating).toFixed(1)) : null, qrScans: count || 0 });
}
