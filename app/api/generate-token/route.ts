import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";
import { generateAccessToken, generateRefreshToken } from "@/utilities/generateToken";

type ApiUser = {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  is_admin: boolean;
};

// Handle preflight OPTIONS
export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

// POST /api/generate-token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch user from Supabase schema
    const rows = await sql<ApiUser[]>`
      SELECT * 
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = rows[0];

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401, headers: corsHeaders }
      );
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    return NextResponse.json(
      { user: { ...userPayload }, accessToken, refreshToken },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Token generation error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
