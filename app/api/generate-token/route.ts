// app/api/user/refresh-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";
import { generateAccessToken, generateRefreshToken } from "@/utilities/generateToken";

type ApiUser = {
  id: string;
  email: string;
  username: string;
  role: string;
  password_hash: string;
};

// Handle preflight OPTIONS
export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

// POST /api/user/refresh-token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, username, role } = body;

    if (!id || !email || !username || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Optionally, check that user exists in DB
    const rows = await sql<ApiUser[]>`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // ✅ Generate new tokens — THIS is where the const line goes
    const newAccessToken = generateAccessToken({
      id,
      email,
      username,
      isAdmin: role === "admin", // matches your generateToken type
    });

    const newRefreshToken = generateRefreshToken({
      id,
      email,
      username,
      isAdmin: role === "admin",
    });

    return NextResponse.json(
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Refresh token error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}