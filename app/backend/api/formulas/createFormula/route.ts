import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { corsHeaders } from "../../../utilities/cors";
import sql from "../../../utilities/db";

type FormulaCreateBody = {
  name: string;
  description?: string;
  data: {
    inputs?: { item: string; quantity?: number }[];
    outputs?: { item: string; quantity?: number }[];
    [key: string]: any;
  };
  folderId?: string | null;
};

// Verify JWT
function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    return decoded as { id: string; email: string };
  } catch (err) {
    console.error("JWT verify error:", err);
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const userFromToken = verifyToken(req);
    if (!userFromToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body: FormulaCreateBody = await req.json();
    const { name, description, data, folderId } = body;

    if (!name || !data || !data.inputs?.length || !data.outputs?.length) {
      return NextResponse.json(
        { success: false, error: "Formula must have at least one input and one output" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1️⃣ Insert formula
    const [formula] = await sql`
      INSERT INTO formulas (user_id, folder_id, name, description, data)
      VALUES (${userFromToken.id}::uuid, ${folderId ?? null}::uuid, ${name}, ${description ?? null}, ${data})
      RETURNING
        id, user_id AS "userId", folder_id AS "folderId", name, description, data,
        version, is_latest AS "isLatest", created_at AS "createdAt", updated_at AS "updatedAt"
    `;

    const formulaId = formula.id;

    // 2️⃣ Insert input variables
    for (const input of data.inputs ?? []) {
      if (!input.item) continue;
      const quantity = input.quantity ?? 1;
      await sql`
        INSERT INTO formula_variables (formula_id, name, type, base_value)
        VALUES (${formulaId}::uuid, ${input.item}, 'input', ${quantity})
      `;
    }

    // 3️⃣ Insert output variables
    for (const output of data.outputs ?? []) {
      if (!output.item) continue;
      const quantity = output.quantity ?? 1;
      await sql`
        INSERT INTO formula_variables (formula_id, name, type, base_value)
        VALUES (${formulaId}::uuid, ${output.item}, 'output', ${quantity})
      `;
    }

    return NextResponse.json(
      { success: true, formula },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Create formula error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}