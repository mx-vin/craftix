import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await req.json();
    const { content, isSensitive } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: "Missing postId or content" },
        { status: 400, headers: corsHeaders }
      );
    }

    const updated = await sql`
      UPDATE posts
      SET
        content = ${content},
        is_sensitive = COALESCE(${isSensitive}, is_sensitive)
      WHERE id = ${postId}::uuid
      RETURNING id, user_id, content, is_sensitive;
    `;

    if (!updated.length) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: "Post updated", post: updated[0] },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Error updating post:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update post", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}