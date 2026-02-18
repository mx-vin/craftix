import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

type ApiPost = {
  id: string;
  username: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  created_at: string | Date;
};

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function GET(_req: Request, ctx: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await ctx.params;

    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400, headers: corsHeaders });
    }

    const rows = await sql<ApiPost[]>`
      SELECT
             p.id::text                     AS "id",
      u.username                     AS "username",
      p.content                      AS "content",
      p.image_uri                     AS "imageUri",
      p.is_sensitive                 AS "isSensitive",
      p.has_offensive_text           AS "hasOffensiveText",
      p.created_at                   AS "created_at"
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE u.username = ${username}
    ORDER BY p.created_at DESC
  `;

  return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Error fetching posts by username:", err);
    return NextResponse.json(
      { error: "Failed to fetch posts by username" },
      { status: 500, headers: corsHeaders }
    );
  }
}

