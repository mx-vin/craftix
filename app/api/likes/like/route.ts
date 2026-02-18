import { NextRequest, NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

export async function POST(req: NextRequest) {
  const { postId, userId } = await req.json();

  if (!postId || !userId) {
    return NextResponse.json({ message: "Missing postId or userId" }, { status: 400, headers: corsHeaders });
  }

  try {
    await sql`
      INSERT INTO post_likes (post_id, user_id)
      VALUES (${postId}, ${userId})
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ message: "Post liked" }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
