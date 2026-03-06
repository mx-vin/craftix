import { NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });

  try {
    const likedPosts = await sql<{ post_id: string }[]>`
      SELECT id AS post_id
      FROM post_likes
      WHERE user_id = ${id}::uuid
    `;
    return NextResponse.json(likedPosts.map(r => ({ postId: r.post_id })), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch user likes" }, { status: 500, headers: corsHeaders });
  }
}