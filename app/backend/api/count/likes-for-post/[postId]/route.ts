import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";

type Params = {
  postId: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Params }
) {
  const { postId } = params;

  try {
    const rows = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM post_likes
      WHERE post_id = ${postId}
    `;

    return NextResponse.json({
      postId,
      likes: rows[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("likes-for-post error:", err);

    return NextResponse.json(
      { error: "Failed to count likes" },
      { status: 500 }
    );
  }
}
