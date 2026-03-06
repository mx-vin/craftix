import { NextRequest, NextResponse } from "next/server";
import sql from "../../../utilities/db";
import { corsHeaders } from "../../../utilities/cors";

export async function DELETE(req: NextRequest) {
  const { postId, userId } = await req.json();

  if (!postId || !userId) {
    return NextResponse.json({ message: "Missing postId or userId" }, { status: 400, headers: corsHeaders });
  }

  try {
    await sql`
      DELETE FROM post_likes
      WHERE post_id = ${postId} AND user_id = ${userId}
    `;

    return NextResponse.json({ message: "Post unliked" }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Unlike error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
