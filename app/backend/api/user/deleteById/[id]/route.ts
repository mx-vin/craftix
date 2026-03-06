import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  role: string;
  profileImage: string | null;
  biography: string;
};

function verifyToken(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);
    return payload as { id: string; email: string; username: string; role: string };
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const userFromToken = verifyToken(_req);
    if (!userFromToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    if (userFromToken.id !== id) {
      return NextResponse.json({ message: "Not authorized to delete this user" }, { status: 403, headers: corsHeaders });
    }

    const rows = await sql<ApiUser[]>`
      DELETE FROM users
      WHERE id = ${id}::uuid
      RETURNING
        id,
        username,
        email,
        password_hash,
        role,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS "biography"
    `;

    if (!rows.length) return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });

    const deletedUser = { ...rows[0], password_hash: null };

    return NextResponse.json({ message: "User deleted successfully", deletedUser }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
