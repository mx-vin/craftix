import { NextResponse } from "next/server";
import sql from "../../../utilities/db";

type FeedPost = {
  _id: string;
  userId: string;
  username: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  createdAt: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 }
    );
  }

  try {
    const rows = await sql<FeedPost[]>`
      SELECT
        p.id::text              AS "_id",
        p.user_id::text        AS "userId",
        u.username             AS "username",
        p.content              AS "content",
        p.image_uri            AS "imageUri",
        p.is_sensitive         AS "isSensitive",
        p.has_offensive_text   AS "hasOffensiveText",
        p.created_at           AS "createdAt"
      FROM posts p
      JOIN users u
        ON u.id = p.user_id
      WHERE u.username = ${username}
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json(rows);
  } catch (err) {
    console.error("feed/username error:", err);

    return NextResponse.json(
      { error: "Failed to fetch user feed" },
      { status: 500 }
    );
  }
}
