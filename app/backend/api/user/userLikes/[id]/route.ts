import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  if (!id) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  try {
    const likedPosts = await sql<{ post_id: string }[]>`
      SELECT post_id
      FROM likes
      WHERE user_id = ${id}::uuid
    `;

    const response = likedPosts.map((row) => ({ postId: row.post_id }));

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("Error fetching user likes:", err);
    return NextResponse.json({ error: "Failed to fetch user likes" }, { status: 500 });
  }
}