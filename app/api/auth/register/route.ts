import { NextRequest, NextResponse } from "next/server";
import { error } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
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
    if (signUpError) {
      // Keep client errors safe, while retaining Supabase's diagnostic details in Vercel logs.
      console.error("Supabase signup failed", { code: signUpError.code, message: signUpError.message, status: signUpError.status });
      if (signUpError.code === "over_email_send_rate_limit") {
        return error("We already sent a confirmation email. Please wait a minute, then check your inbox and spam folder.", 429);
      }
      if (signUpError.code === "email_address_invalid") {
        return error("Please use a valid email address that you can access.");
      }
      return error(signUpError.message.toLowerCase().includes("already") ? "An account with this email already exists. Check your inbox to confirm it, then sign in." : "We couldn’t create your account. Please try again in a moment.", signUpError.message.toLowerCase().includes("already") ? 409 : 400);
    }
    return NextResponse.json({ token: data.session?.access_token ?? null, businessName, emailConfirmationRequired: !data.session }, { status: 201 });
  } catch (cause) {
    console.error("Registration route failed", cause);
    return error("The account service is temporarily unavailable. Please try again in a moment.", 503);
  }
}
