import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import sql from "../../../utilities/db";
import { corsHeaders } from "../../../utilities/cors";

function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.ACCESS_TOKEN_SECRET!) as {
      id: string;
      email: string;
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyToken(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400, headers: corsHeaders });
    }

    const [folder] = await sql`
      INSERT INTO folders (user_id, name)
      VALUES (${user.id}::uuid, ${name})
      RETURNING id, user_id, name, created_at
    `;

    return NextResponse.json({ success: true, folder }, { status: 201, headers: corsHeaders });
  } catch (err) {
    console.error("createFolder error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}