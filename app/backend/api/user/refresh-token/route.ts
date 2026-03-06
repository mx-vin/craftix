import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../../../utilities/generateToken";
import { corsHeaders } from "../../../utilities/cors";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

interface DecodedUser { id: string; email?: string; username?: string; role?: string; }

const verifyRefreshToken = (token: string): DecodedUser => {
  try { return jwt.verify(token, REFRESH_TOKEN_SECRET) as DecodedUser; }
  catch { throw new Error("Invalid or expired refresh token"); }
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) return NextResponse.json({ message: "No refresh token provided" }, { status: 401, headers: corsHeaders });

    const decoded = verifyRefreshToken(refreshToken);
    const { id, email, username, role } = decoded;
    const isAdmin = role === "admin";

    const newAccessToken = generateAccessToken({ id, email: email!, username: username!, isAdmin });
    const newRefreshToken = generateRefreshToken({ id, email: email!, username: username!, isAdmin });

    return NextResponse.json({ accessToken: newAccessToken, refreshToken: newRefreshToken }, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403, headers: corsHeaders });
  }
}