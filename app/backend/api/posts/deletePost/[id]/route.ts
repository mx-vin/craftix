import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await sql<{ deleted: boolean }[]>`
      DELETE FROM posts
      WHERE id = ${id}::uuid
      RETURNING TRUE AS deleted;
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: "Post deleted successfully", data: { postId: id } },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Error deleting post:", err);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500, headers: corsHeaders }
    );
  }
}