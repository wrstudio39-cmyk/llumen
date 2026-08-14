import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { calculateReadingTime, extractPlainText } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json({ post: data });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.content !== undefined) {
    patch.content = body.content;
    patch.reading_time_minutes = calculateReadingTime(extractPlainText(body.content));
  }
  if (body.contentHtml !== undefined) patch.content_html = body.contentHtml;
  if (body.excerpt !== undefined) patch.excerpt = body.excerpt;
  if (body.coverImageUrl !== undefined) patch.cover_image_url = body.coverImageUrl;
  if (body.status !== undefined) patch.status = body.status;

  // RLS (011_rls_policies.sql) enforces that only the post's own author,
  // or an admin/editor, can actually update it — this update simply fails
  // with a Postgres permission error for anyone else.
  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
