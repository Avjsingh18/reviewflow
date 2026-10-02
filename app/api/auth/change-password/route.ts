import { NextRequest, NextResponse } from "next/server";
import { error, requireUser } from "@/lib/api";
import { supabasePublic } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (newPassword.length < 8) return error("Your new password must contain at least 8 characters.");
  if (!auth.user.email || !currentPassword) return error("Enter your current password.");
  const client = supabasePublic();
  const { error: checkError } = await client.auth.signInWithPassword({ email: auth.user.email, password: currentPassword });
  if (checkError) return error("Your current password is incorrect.", 401);
  const { error: updateError } = await auth.supabase.auth.admin.updateUserById(auth.user.id, { password: newPassword });
  if (updateError) return error("We couldn’t update your password.", 400);
  return NextResponse.json({ ok: true });
}
