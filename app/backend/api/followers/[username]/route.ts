import { NextRequest, NextResponse } from "next/server";
import sql from "../../../utilities/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const rows = await sql`
      SELECT follower_username AS username
      FROM followers_with_usernames
      WHERE following_username = ${username}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(rows.map((r) => r.username));
  } catch (err) {
    console.error("GET FOLLOWERS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch followers", details: String(err) },
      { status: 500 }
    );
  }
}