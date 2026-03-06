import { NextResponse } from "next/server";
import { corsHeaders } from "../../../utilities/cors";
import { reviveDates } from "../../../utilities/reviveDates";
import sql from "../../../utilities/db";

type ApiPost = {
  id: string;
  userId: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  created_at: string | Date;
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const rows = await sql<ApiPost[]>`
      SELECT
        id::text        AS "id",
        user_id::text   AS "userId",
        content,
        image_uri       AS "imageUri",
        is_sensitive    AS "isSensitive",
        has_offensive_text AS "hasOffensiveText",
        created_at
      FROM posts
      ORDER BY created_at DESC
    `;

    const posts = reviveDates(rows);

    return NextResponse.json(posts, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Error fetching all posts:", err);
    return NextResponse.json(
      { error: "Failed to fetch all posts" },
      { status: 500, headers: corsHeaders }
    );
  }
}
