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
      return NextResponse.json({ error: "User to unfollow not found" }, { status: 404 });
    }

    // Delete follow
    await sql`
      DELETE FROM followers
      WHERE follower_id = ${follower[0].id}
        AND following_id = ${following[0].id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("UNFOLLOW ERROR:", err);
    return NextResponse.json(
      { error: "Failed to unfollow user", details: String(err) },
      { status: 500 }
    );
  }
}