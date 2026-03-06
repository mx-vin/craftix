import { NextResponse } from "next/server";
import { corsHeaders } from "../../../utilities/cors";
import sql from "../../../utilities/db";

type ApiPost = {
  id: string;
  content: string;
  created_at: string;
  username: string;
  profile_image: string | null;
  hashtag: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");

  if (!tag || tag.trim() === "") {
    return NextResponse.json(
      { success: false, message: "Missing or empty 'tag' query parameter." },
      { status: 400, headers: corsHeaders }
    );
  }

  const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;

  try {
    const rows = await sql<ApiPost[]>`
      SELECT
        p.id::text           AS "id",
        p.content            AS "content",
        p.created_at         AS "created_at",
        u.username           AS "username",
        u.profile_image      AS "profile_image",
        h.tag                AS "hashtag"
      FROM posts p
      JOIN post_tags pt ON p.id = pt.post_id
      JOIN tags h ON pt.tag_id = h.id
      JOIN users u ON p.user_id = u.id
      WHERE h.tag = ${normalizedTag}
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      hashtag: normalizedTag,
      count: rows.length,
      posts: rows,
    });
  } catch (error) {
    console.error("Error fetching posts by tag:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch posts by tag." },
      { status: 500, headers: corsHeaders }
    );
  }
}
