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

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO followers (follower_id, following_id)
      VALUES (${followerId}, ${followingId})
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}
