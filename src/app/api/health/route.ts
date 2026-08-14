import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export async function GET() {
  return NextResponse.json({
    ok: true,
    backend: isSupabaseConfigured ? "supabase" : "mock (localStorage)",
    time: new Date().toISOString(),
  });
}
