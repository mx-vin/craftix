import { NextRequest, NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

type LikeRow = {
  id: string;
  user_id: string;
  post_id: string;
  username: string | null;
  profile_image: string | null;
  created_at: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql<LikeRow[]>`
      SELECT
        (pl.user_id::text || '-' || pl.post_id::text) AS "id",
        pl.user_id::text AS "user_id",
        pl.post_id::text AS "post_id",
        u.username,
        u.profile_image,
        pl.created_at
      FROM post_likes pl
      JOIN users u ON u.id = pl.user_id
      WHERE u.username = ${username}
      ORDER BY pl.created_at DESC
    `;

    const likes = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      post_id: row.post_id,
      username: row.username ?? null,
      profileImage: row.profile_image ?? null,
      created_at: row.created_at,
    }));

    return NextResponse.json(likes, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching likes list:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes list" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}