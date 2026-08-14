import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { generateSlug, calculateReadingTime, extractPlainText } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const status = request.nextUrl.searchParams.get("status");

  let query = supabase.from("posts").select("*").order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ posts: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const title: string = body.title || "Untitled";
  const slug: string = body.slug || generateSlug(title);
  const plainText = extractPlainText(body.content);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title,
      slug,
      content: body.content ?? null,
      content_html: body.contentHtml ?? null,
      excerpt: body.excerpt ?? null,
      cover_image_url: body.coverImageUrl ?? null,
      author_id: user.id,
      reading_time_minutes: calculateReadingTime(plainText),
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post: data }, { status: 201 });
}
