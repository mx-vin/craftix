'use server';

import { NextResponse } from 'next/server';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Type for user row from DB
type DBUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password, register } = body;

    // Validate fields
    if (!email || !password || (register && !username)) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (register) {
      // Check if email or username already exists
      const existing = await sql<DBUser[]>`
        SELECT * FROM users
        WHERE email = ${email} OR username = ${username}
        LIMIT 1
      `;

      if (existing.length > 0) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }

      // Hash password
      const hash = await bcrypt.hash(password, 10);

      // Insert new user
      const inserted = await sql<DBUser[]>`
        INSERT INTO users (username, email, password_hash)
        VALUES (${username}, ${email}, ${hash})
        RETURNING id, username, email, is_admin, created_at, updated_at
      `;

      const user = inserted[0];

      return NextResponse.json({ user }, { status: 201 });
    } else {
      // Login flow
      const rows = await sql<DBUser[]>`
        SELECT * FROM users
        WHERE email = ${email}
        LIMIT 1
      `;

      const user = rows[0];
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check password
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: user.is_admin,
        },
      });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}