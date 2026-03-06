import { NextResponse } from "next/server";
import sql from "../../../utilities/db";

type Body = {
  followerUsername: string;
  followingUsername: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const { followerUsername, followingUsername } = body;

    if (!followerUsername || !followingUsername) {
      return NextResponse.json(
        { error: "Missing followerUsername or followingUsername" },
        { status: 400 }
      );
    }

    if (followerUsername === followingUsername) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Lookup follower UUID
    const follower = await sql`
      SELECT id FROM users WHERE username = ${followerUsername}
    `;
    if (!follower.length) {
      return NextResponse.json({ error: "Follower not found" }, { status: 404 });
    }

    // Lookup following UUID
    const following = await sql`
      SELECT id FROM users WHERE username = ${followingUsername}
    `;
    if (!following.length) {
      return NextResponse.json({ error: "User to follow not found" }, { status: 404 });
    }

    // Insert follow (ignore duplicates)
    await sql`
      INSERT INTO followers (follower_id, following_id)
      VALUES (${follower[0].id}, ${following[0].id})
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FOLLOW ERROR:", error);
    return NextResponse.json(
      { error: "Failed to follow user", details: String(error) },
      { status: 500 }
    );
  }
}