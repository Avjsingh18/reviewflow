import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { response: error("Please sign in.", 401) };
  const supabase = supabaseAdmin();
  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data.user) return { response: error("Your session has expired. Please sign in again.", 401) };
  return { supabase, user: data.user };
}

export function publicOrigin(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export function trackingUrl(request: NextRequest, slug: string) {
  return `${publicOrigin(request)}/r/${slug}`;
}

export function slugify(value: string) {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100) || "business";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
