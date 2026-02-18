import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

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
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await ctx.params;
    if (!username) {
      return NextResponse.json({ success: false, message: "username required" }, { status: 400, headers: corsHeaders });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const postsPerPage = parseInt(searchParams.get("postsPerPage") || "10");
    const offset = (page - 1) * postsPerPage;

    const rows = await sql<ApiPost[]>`
      SELECT
        p.id::text          AS "id",
        p.user_id::text     AS "userId",
        u.username          AS "username",
        p.content           AS "content",
        p.image_uri         AS "imageUri",
        p.is_sensitive      AS "isSensitive",
        p.has_offensive_text AS "hasOffensiveText",
        p.created_at
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE u.username = ${username}
      ORDER BY p.created_at DESC
      OFFSET ${offset} LIMIT ${postsPerPage}
    `;

    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Error fetching paginated posts by username:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching posts by username", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
