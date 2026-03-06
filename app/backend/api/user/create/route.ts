// app/backend/api/user/create/route.ts
import { NextResponse } from "next/server";
import sql from "../../../utilities/db";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${password})
      RETURNING id, username, email
    `;

    return NextResponse.json({ success: true, user: result[0] });
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}