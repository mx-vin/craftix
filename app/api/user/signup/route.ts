import { NextResponse } from "next/server";
 
import bcrypt from "bcrypt";
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  role: string;
  imageId: string | null;
  profileImage: string | null;
  biography: string;
};

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// POST /api/user/signup
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password_hash } = body;

    if (!username || !email || !password_hash) {
      return NextResponse.json(
        { message: "Username, email, and password_hash are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check username
    const usernameRows = await sql<ApiUser[]>`
      SELECT user_id::text AS "id" 
      FROM ssu_users 
      WHERE username = ${username} 
      LIMIT 1
    `;
    if (usernameRows.length > 0) {
      return NextResponse.json(
        { message: "Username is taken, make another one" },
        { status: 409, headers: corsHeaders }
      );
    }

    // Check email
    const emailRows = await sql<ApiUser[]>`
      SELECT user_id::text AS "id" 
      FROM ssu_users 
      WHERE email = ${email} 
      LIMIT 1
    `;
    if (emailRows.length > 0) {
      return NextResponse.json(
        { message: "Email already exists, make another one" },
        { status: 409, headers: corsHeaders }
      );
    }

    // Hash password_hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password_hash, salt);

    // Insert user
    const rows = await sql<ApiUser[]>`
      INSERT INTO ssu_users (username, email, password_hash)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING
        user_id::text AS "id",
        username,
        email,
        password_hash,
        role::text AS "role",
        NULL::text AS "imageId",
        NULL::text AS "profileImage",
        '' AS "biography"
    `;
    const newUser = rows[0];
    const safeUser = { ...newUser, password_hash: null };

    return NextResponse.json(safeUser, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Server error during signup" },
      { status: 500, headers: corsHeaders }
    );
  }
}