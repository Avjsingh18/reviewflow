import { NextRequest, NextResponse } from "next/server";
import { error, requireUser, slugify, trackingUrl } from "@/lib/api";

function validInput(body: unknown) {
  const input = body as { name?: unknown; googleReviewUrl?: unknown } | null;
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const googleReviewUrl = typeof input?.googleReviewUrl === "string" ? input.googleReviewUrl.trim() : "";
  try { const parsed = new URL(googleReviewUrl); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); } catch { return null; }
  return name && name.length <= 160 ? { name, googleReviewUrl } : null;
}

async function responseForBusiness(request: NextRequest, supabase: ReturnType<typeof import("@/lib/supabase/server").supabaseAdmin>, business: { id: string; name: string; slug: string; google_review_url: string }) {
  const { data: qr } = await supabase.from("qr_codes").select("tracking_slug").eq("business_id", business.id).eq("active", true).maybeSingle();
  return NextResponse.json({ id: business.id, name: business.name, slug: business.slug, googleReviewUrl: business.google_review_url, trackingUrl: qr ? trackingUrl(request, qr.tracking_slug) : null });
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const { data: business } = await auth.supabase.from("businesses").select("id,name,slug,google_review_url").eq("user_id", auth.user.id).maybeSingle();
  if (!business) return error("Complete onboarding to create your business.", 404);
  return responseForBusiness(request, auth.supabase, business);
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const input = validInput(await request.json().catch(() => null)); if (!input) return error("Enter a valid business name and Google review URL.");
  const { data: existing } = await auth.supabase.from("businesses").select("id").eq("user_id", auth.user.id).maybeSingle();
  if (existing) return error("This account already has a business.", 409);
  const { data: business, error: insertError } = await auth.supabase.from("businesses").insert({ user_id: auth.user.id, name: input.name, google_review_url: input.googleReviewUrl, slug: slugify(input.name) }).select("id,name,slug,google_review_url").single();
  if (insertError || !business) return error("We couldn’t save your business.");
  return responseForBusiness(request, auth.supabase, business);
}

export async function PUT(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const input = validInput(await request.json().catch(() => null)); if (!input) return error("Enter a valid business name and Google review URL.");
  const { data: business, error: updateError } = await auth.supabase.from("businesses").update({ name: input.name, google_review_url: input.googleReviewUrl, updated_at: new Date().toISOString() }).eq("user_id", auth.user.id).select("id,name,slug,google_review_url").single();
  if (updateError || !business) return error("We couldn’t update your business.", 404);
  return responseForBusiness(request, auth.supabase, business);
}
