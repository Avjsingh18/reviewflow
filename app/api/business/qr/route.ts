import { NextRequest, NextResponse } from "next/server";
import { error, requireUser, trackingUrl } from "@/lib/api";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const { data: business } = await auth.supabase.from("businesses").select("id,slug").eq("user_id", auth.user.id).maybeSingle();
  if (!business) return error("Complete onboarding first.", 404);
  let { data: qr } = await auth.supabase.from("qr_codes").select("id,tracking_slug").eq("business_id", business.id).eq("active", true).maybeSingle();
  if (!qr) {
    const { data, error: createError } = await auth.supabase.from("qr_codes").insert({ business_id: business.id, tracking_slug: business.slug, active: true }).select("id,tracking_slug").single();
    if (createError || !data) return error("We couldn’t create your QR code.");
    qr = data;
  }
  return NextResponse.json({ id: qr.id, slug: qr.tracking_slug, trackingUrl: trackingUrl(request, qr.tracking_slug) });
}
