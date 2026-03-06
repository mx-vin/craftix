import { NextResponse } from "next/server";
import { corsHeaders } from "../../../utilities/cors";
import sql from "../../../utilities/db";

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

type ApiPost = {
  id: string;
  userId: string;
  username: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  created_at: string | Date;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, content, imageUri, isSensitive } = body;

    if (!username || !content) {
      return NextResponse.json(
        { error: "Missing required fields: username or content" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Insert post and return result
    const rows = await sql<ApiPost[]>`
      INSERT INTO posts (user_id, content, image_uri, is_sensitive, has_offensive_text, created_at)
      SELECT u.id, ${content}, ${imageUri || null}, ${isSensitive ?? false}, FALSE, NOW()
      FROM users u
      WHERE u.username = ${username}
      RETURNING
        id::text AS "id",
        user_id::text AS "userId",
        ${username} AS "username",
        content AS "content",
        image_uri AS "imageUri",
        is_sensitive AS "isSensitive",
        has_offensive_text AS "hasOffensiveText",
        created_at
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `User not found: ${username}` },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(rows[0], { status: 201, headers: corsHeaders });
  } catch (err: any) {
    console.error("Error creating post:", err);
    return NextResponse.json(
      { error: "Failed to create post", details: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
