import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

type LikeRow = {
  id: string; // combined key: userId-postId
  user_id: string;
  post_id: string;
  username: string | null;
  profile_image: string | null;
  created_at: string;
};

// GET /api/likes/view-likes/[postId]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Validate UUID
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch all users who liked the post
    const rows = await sql<LikeRow[]>`
      SELECT
        (pl.user_id::text || '-' || pl.post_id::text) AS "id",
        pl.user_id::text AS "user_id",
        pl.post_id::text AS "post_id",
        u.username,
        u.profile_image,
        pl.created_at
      FROM post_likes pl
      LEFT JOIN users u ON u.id = pl.user_id
      WHERE pl.post_id = ${id}::uuid
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

// Handle preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
