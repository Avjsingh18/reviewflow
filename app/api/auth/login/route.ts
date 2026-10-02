import { NextRequest, NextResponse } from "next/server";
import { error } from "@/lib/api";
import { supabaseAdmin, supabasePublic } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return error("Enter your email and password.");
  const { data, error: signInError } = await supabasePublic().auth.signInWithPassword({ email, password });
  if (signInError || !data.session) return error("Incorrect email or password.", 401);
  const { data: business } = await supabaseAdmin().from("businesses").select("name").eq("user_id", data.user.id).maybeSingle();
  return NextResponse.json({
    token: data.session.access_token,
    businessName: business?.name || data.user.user_metadata.business_name || "",
    onboardingRequired: !business,
  });
}
