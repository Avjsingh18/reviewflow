import { NextRequest, NextResponse } from "next/server";
import { error, requireUser, slugify, trackingUrl } from "@/lib/api";

type Location = { latitude: number; longitude: number };
type Business = { id: string; name: string; slug: string; google_review_url: string; latitude: number | null; longitude: number | null };
type BusinessBase = Omit<Business, "latitude" | "longitude">;

function validInput(body: unknown) {
  const input = body as { name?: unknown; googleReviewUrl?: unknown; latitude?: unknown; longitude?: unknown } | null;
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const googleReviewUrl = typeof input?.googleReviewUrl === "string" ? input.googleReviewUrl.trim() : "";
  try { const parsed = new URL(googleReviewUrl); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); } catch { return null; }

  const hasLatitude = Object.hasOwn(input ?? {}, "latitude");
  const hasLongitude = Object.hasOwn(input ?? {}, "longitude");
  if (hasLatitude !== hasLongitude) return null;
  let location: Location | undefined;
  if (hasLatitude && hasLongitude) {
    const latitude = typeof input?.latitude === "number" ? input.latitude : Number.NaN;
    const longitude = typeof input?.longitude === "number" ? input.longitude : Number.NaN;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    location = { latitude, longitude };
  }
  return name && name.length <= 160 ? { name, googleReviewUrl, location } : null;
}

async function responseForBusiness(request: NextRequest, supabase: ReturnType<typeof import("@/lib/supabase/server").supabaseAdmin>, business: Business) {
  const { data: qr } = await supabase.from("qr_codes").select("tracking_slug").eq("business_id", business.id).eq("active", true).maybeSingle();
  return NextResponse.json({
    id: business.id, name: business.name, slug: business.slug, googleReviewUrl: business.google_review_url,
    latitude: business.latitude, longitude: business.longitude,
    trackingUrl: qr ? trackingUrl(request, qr.tracking_slug) : null,
  });
}

const businessFields = "id,name,slug,google_review_url";

async function withLocation(supabase: ReturnType<typeof import("@/lib/supabase/server").supabaseAdmin>, business: BusinessBase): Promise<Business> {
  const { data, error: locationError } = await supabase.from("businesses").select("latitude,longitude").eq("id", business.id).maybeSingle();
  return { ...business, latitude: locationError ? null : data?.latitude ?? null, longitude: locationError ? null : data?.longitude ?? null };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const { data: business } = await auth.supabase.from("businesses").select(businessFields).eq("user_id", auth.user.id).maybeSingle();
  if (!business) return error("Complete onboarding to create your business.", 404);
  return responseForBusiness(request, auth.supabase, await withLocation(auth.supabase, business as BusinessBase));
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const input = validInput(await request.json().catch(() => null)); if (!input) return error("Enter a valid business name, Google review URL, and location.");
  const { data: existing } = await auth.supabase.from("businesses").select("id").eq("user_id", auth.user.id).maybeSingle();
  if (existing) return error("This account already has a business.", 409);
  const { data: business, error: insertError } = await auth.supabase.from("businesses").insert({
    user_id: auth.user.id, name: input.name, google_review_url: input.googleReviewUrl, slug: slugify(input.name),
    ...(input.location ? { ...input.location, location_updated_at: new Date().toISOString() } : {}),
  }).select(businessFields).single();
  if (insertError || !business) return error("We couldn’t save your business.");
  return responseForBusiness(request, auth.supabase, await withLocation(auth.supabase, business as BusinessBase));
}

export async function PUT(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const input = validInput(await request.json().catch(() => null)); if (!input) return error("Enter a valid business name, Google review URL, and location.");
  const { data: business, error: updateError } = await auth.supabase.from("businesses").update({
    name: input.name, google_review_url: input.googleReviewUrl, updated_at: new Date().toISOString(),
    ...(input.location ? { ...input.location, location_updated_at: new Date().toISOString() } : {}),
  }).eq("user_id", auth.user.id).select(businessFields).single();
  if (updateError || !business) return error("We couldn’t update your business.", 404);
  return responseForBusiness(request, auth.supabase, await withLocation(auth.supabase, business as BusinessBase));
}
