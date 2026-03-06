import { NextRequest, NextResponse } from "next/server";
import sql from "../../../utilities/db";
import { corsHeaders } from "../../../utilities/cors";

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const postId = searchParams.get("postId");

  if (!userId && !postId) {
    return NextResponse.json({ message: "Missing userId or postId" }, { status: 400, headers: corsHeaders });
  }

  let rows;
  if (postId) {
    rows = await sql<{ image_uri: string }[]>`
      SELECT image_uri
      FROM post_images
      WHERE post_id = ${postId}
      ORDER BY created_at DESC
    `;
  } else {
    rows = await sql<{ profile_image: string }[]>`
      SELECT profile_image
      FROM users
      WHERE id = ${userId}
    `;
  }

  return NextResponse.json(rows, { status: 200, headers: corsHeaders });
}
