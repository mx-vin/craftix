// app/backend/api/user/create/route.ts
import { NextResponse } from "next/server";
import sql from "../../../utilities/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 🔐 Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id, username, email
    `;

    return NextResponse.json({ success: true, user: result[0] });

  } catch (err: any) {
    console.error("CREATE USER ERROR:", err);

    // Optional: handle duplicate email nicely
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}