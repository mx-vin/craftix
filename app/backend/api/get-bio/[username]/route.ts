import { NextResponse } from "next/server";
import sql from "../../../utilities/db";

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    // Fetch user info from Supabase schema
    const rows = await sql<{ id: string; username: string; email: string }[]>`
      SELECT 
        id,
        username,
        email
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const user = rows[0];

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      // Add profileImage/biography if you add columns later
      profileImage: null,
      biography: null
    });
  } catch (err: any) {
    console.error("get-bio error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
