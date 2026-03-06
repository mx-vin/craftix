import { NextRequest, NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

// GET /api/like/user-likes/[username]
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const username = segments[segments.length - 1];

  if (!username) {
    return NextResponse.json(
      { message: "Missing username" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Fetch posts liked by the user
    const rows = await sql<{
      post_id: string;
      content: string;
      image_uri: string | null;
      post_user_id: string;
      post_username: string;
      created_at: string;
    }[]>`
      SELECT 
        p.id AS post_id,
        p.content,
        p.image_uri,
        u.id AS post_user_id,
        u.username AS post_username,
        p.created_at
      FROM post_likes pl
      INNER JOIN posts p ON pl.post_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN users liker ON pl.user_id = liker.id
      WHERE liker.username = ${username}
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json({ posts: rows }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching user likes:", error);
    return NextResponse.json(
      { message: "Server error fetching liked posts" },
      { status: 500, headers: corsHeaders }
    );
  }
}
