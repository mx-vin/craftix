import { NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

type ApiPost = {
  id: string;
  userId: string;
  username: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  created_at: string;
};

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql<ApiPost[]>`
      SELECT
        p.id::text             AS "id",
        p.user_id::text        AS "userId",
        u.username             AS "username",
        p.content              AS "content",
        p.image_uri            AS "imageUri",
        p.is_sensitive         AS "isSensitive",
        p.has_offensive_text   AS "hasOffensiveText",
        p.created_at
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ${id}::uuid
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching post by id:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch post" },
      { status: 500, headers: corsHeaders }
    );
  }
}
