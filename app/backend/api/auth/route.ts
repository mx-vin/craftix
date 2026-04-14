import { NextResponse } from "next/server";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ExistingUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

type InsertedUser = {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export async function POST(req: Request) {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: "Missing POSTGRES_URL" },
        { status: 500 }
      );
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      return NextResponse.json(
        { error: "Missing ACCESS_TOKEN_SECRET" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email, username, password, register } = body;

    if (!email || !password || (register && !username)) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    if (register) {
      const existing = await sql<ExistingUser[]>`
        SELECT *
        FROM users
        WHERE email = ${email} OR username = ${username}
        LIMIT 1
      `;

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        );
      }

      const hash = await bcrypt.hash(password, 10);

      const inserted = await sql<InsertedUser[]>`
        INSERT INTO users (username, email, password_hash)
        VALUES (${username}, ${email}, ${hash})
        RETURNING id, username, email, is_admin, created_at, updated_at
      `;

      if (!inserted.length) {
        return NextResponse.json(
          { error: "User insert failed" },
          { status: 500 }
        );
      }

      const user = inserted[0];

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );

      return NextResponse.json({ user, token }, { status: 201 });
    }

    const rows = await sql<ExistingUser[]>`
      SELECT *
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
      },
      token,
    });
  } catch (err: any) {
    console.error("AUTH ROUTE ERROR:", err);

    return NextResponse.json(
      {
        error: err?.message || "Server error",
        detail: String(err),
      },
      { status: 500 }
    );
  }
}