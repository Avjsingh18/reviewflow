import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

async function hash(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = supabaseAdmin();
  const { data: qr } = await supabase.from("qr_codes").select("id,business_id,active").eq("tracking_slug", slug).maybeSingle();
  if (!qr) return new NextResponse("QR code not found.", { status: 404 });
  const { data: business } = await supabase.from("businesses").select("google_review_url").eq("id", qr.business_id).maybeSingle();
  if (!business) return new NextResponse("Business not found.", { status: 404 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  await supabase.from("qr_scans").insert({ qr_code_id: qr.id, ip_hash: ip ? await hash(ip) : null, user_agent: request.headers.get("user-agent")?.slice(0, 1024) || null });
  return NextResponse.redirect(business.google_review_url, { status: 302 });
}
