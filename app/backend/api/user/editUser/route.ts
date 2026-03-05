import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized: Missing token" }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401, headers: corsHeaders });
    }

    const userId = decoded.id;
    if (!userId) return NextResponse.json({ success: false, message: "Invalid token payload" }, { status: 400, headers: corsHeaders });

    const body = await req.json();
    const username = body.username?.trim() || null;
    const email = body.email?.trim() || null;
    const password_hash = body.password_hash?.trim() || null;
    const biography = body.biography?.trim() || null;

    const [existingUser] = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if (!existingUser) return NextResponse.json({ success: false, message: "User not found" }, { status: 404, headers: corsHeaders });

    if (username) {
      const [conflict] = await sql`
        SELECT id FROM users
        WHERE LOWER(username) = LOWER(${username}) AND id <> ${userId}
      `;
      if (conflict) return NextResponse.json({ success: false, message: "Username is already taken" }, { status: 409, headers: corsHeaders });
    }

    let hashedPassword = existingUser.password_hash;
    if (password_hash) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password_hash, salt);
    }

    const [updatedUser] = await sql`
      UPDATE users
      SET
        username = COALESCE(${username}, username),
        email = COALESCE(${email}, email),
        password_hash = ${hashedPassword},
        biography = COALESCE(${biography}, biography)
      WHERE id = ${userId}
      RETURNING id, username, email, biography
    `;

    return NextResponse.json({ success: true, message: "User updated successfully", user: updatedUser }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ success: false, message: "Server error while updating user information" }, { status: 500, headers: corsHeaders });
  }
}
