import { NextResponse } from "next/server";
import sql from "@/utilities/db";

type Body = {
  followerId: string;
  followingId: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    const { followerId, followingId } = body;

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: "Missing followerId or followingId" },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM followers
      WHERE follower_id = ${followerId}
        AND following_id = ${followingId}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
