import { getSupabaseClient } from "@/lib/supabaseClient";

const FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-staff`;

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  title: string | null;
  role: "admin" | "editor" | "author";
  createdAt: string;
  lastSignInAt: string | null;
}

async function callStaffFunction<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("You need to be signed in.");

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json as T;
}

export const listStaff = () => callStaffFunction<{ staff: StaffMember[] }>({ action: "list" });

export const createStaff = (input: { email: string; password: string; name: string; role: string }) =>
  callStaffFunction<{ ok: true; id: string }>({ action: "create", ...input });

export const updateStaffRole = (userId: string, role: string) =>
  callStaffFunction<{ ok: true }>({ action: "updateRole", userId, role });

export const removeStaff = (userId: string) => callStaffFunction<{ ok: true }>({ action: "remove", userId });
