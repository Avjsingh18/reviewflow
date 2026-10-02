import { NextRequest, NextResponse } from "next/server";
import { error } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const ownerName = typeof body?.ownerName === "string" ? body.ownerName.trim() : "";
  const businessName = typeof body?.businessName === "string" ? body.businessName.trim() : "";
  if (!email || !ownerName || !businessName || password.length < 8) return error("Enter your name, business name, email, and a password with at least 8 characters.");

  const { data, error: signUpError } = await supabaseAdmin().auth.signUp({
    email,
    password,
    options: { data: { owner_name: ownerName, business_name: businessName }, emailRedirectTo: `${new URL(request.url).origin}/login` },
  });
  if (signUpError) return error(signUpError.message.includes("already") ? "An account with this email already exists." : "We couldn’t create your account.", signUpError.message.includes("already") ? 409 : 400);
  return NextResponse.json({ token: data.session?.access_token ?? null, businessName, emailConfirmationRequired: !data.session }, { status: 201 });
}
