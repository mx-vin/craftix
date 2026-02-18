import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// Request body:
// {
//   "post_id": "uuid",
//   "tags": ["#Community", "#Physics"]
// }

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { post_id, tags } = body;

    if (!post_id || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: post_id and non-empty tags array" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify post exists
    const postCheck = await sql`SELECT id FROM posts WHERE id = ${post_id}`;
    if (postCheck.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404, headers: corsHeaders });
    }

    for (let rawTag of tags) {
      if (typeof rawTag !== "string") continue;

      let tag = rawTag.trim();
      if (!tag.startsWith("#")) tag = `#${tag}`;
      if (tag.length === 1) continue;

      if (tag.length > 255) continue;
      const validPattern = /^#[A-Za-z0-9_]+$/;
      if (!validPattern.test(tag)) continue;

      await sql`
        INSERT INTO post_tags (post_id, tag)
        VALUES (${post_id}, ${tag})
        ON CONFLICT (post_id, tag) DO NOTHING
      `;
    }

    return NextResponse.json(
      { success: true, message: "Tags attached to post", post_id },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error attaching tags to post:", error);
    return NextResponse.json(
      { error: "Failed to attach tags to post" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
