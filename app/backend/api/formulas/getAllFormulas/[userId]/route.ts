import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

type TokenPayload = {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
};

type FormulaRow = {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  description: string | null;
  data: unknown;
  created_at: string;
  updated_at: string;
};

function verifyToken(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as TokenPayload;
  } catch (err) {
    console.error("JWT verify error:", err);
    return null;
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authUser = verifyToken(req);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (authUser.id.trim() !== userId.trim()) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    const formulas = await sql<FormulaRow[]>`
      SELECT
        id::text,
        user_id::text,
        folder_id::text,
        name,
        description,
        data,
        created_at,
        updated_at
      FROM formulas
      WHERE user_id = ${userId}::uuid
      ORDER BY updated_at DESC, created_at DESC
    `;

    return NextResponse.json(
      {
        success: true,
        formulas,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Get all formulas error:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        detail: err?.message || String(err),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}