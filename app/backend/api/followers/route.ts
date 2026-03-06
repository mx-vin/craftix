import { NextResponse } from "next/server";
import sql from "../../utilities/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Missing username query parameter" },
      { status: 400 }
    );
  }

  try {
    // Use the followers_with_usernames view
    const rows = await sql`
      SELECT following_username AS username
      FROM followers_with_usernames
      WHERE follower_username = ${username}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(rows.map(r => r.username));
  } catch (err) {
    console.error("GET FOLLOWING ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch following list", details: String(err) },
      { status: 500 }
    );
  }
}