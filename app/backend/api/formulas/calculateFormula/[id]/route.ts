import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

// Recursive formula calculator
async function calculateFormula(
  formulaId: string,
  inputOverrides: Record<string, number> = {},
  visited: Set<string> = new Set()
): Promise<Record<string, number>> {
  if (visited.has(formulaId)) {
    throw new Error(`Circular formula reference detected at formula ${formulaId}`);
  }
  visited.add(formulaId);

  // Fetch variables and their base values
  const variables = await sql`
    SELECT id, name, type, base_value::float
    FROM formula_variables
    WHERE formula_id = ${formulaId}::uuid
  `;

  const inputVars = variables.filter(v => v.type === "input");
  const outputVars = variables.filter(v => v.type === "output");

  // Determine effective input values
  const inputValues: Record<string, number> = {};
  inputVars.forEach(v => {
    inputValues[v.name] = inputOverrides[v.name] ?? v.base_value ?? 1;
  });

  // Fetch linked subformulas
  const links = await sql`
    SELECT * FROM formula_links WHERE from_formula_id = ${formulaId}::uuid
  `;

  // Recursively calculate subformulas
  for (const link of links) {
    const subFormulaId = link.to_formula_id;
    const targetVarId = link.to_variable_id;

    const subResult = await calculateFormula(subFormulaId, inputOverrides, visited);

    // Assign subformula result to parent input variable
    const targetVar = await sql`
      SELECT name FROM formula_variables WHERE id = ${targetVarId}::uuid
    `;
    if (targetVar[0]?.name && subResult[targetVar[0].name] !== undefined) {
      inputValues[targetVar[0].name] = subResult[targetVar[0].name];
    }
  }

  // Compute outputs proportionally based on all input ratios
  const calculatedOutputs: Record<string, number> = {};
  outputVars.forEach(o => {
    let scale = 1;

    if (inputVars.length) {
      const ratios = inputVars.map(i => inputValues[i.name] / (i.base_value ?? 1));
      scale = Math.min(...ratios); // use min ratio for scaling
    }

    calculatedOutputs[o.name] = Math.round(scale * (o.base_value ?? 1));
  });

  visited.delete(formulaId);
  return calculatedOutputs;
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const inputOverrides: Record<string, number> = body.inputs || {};

    console.log("Calculating formula:", id);
    console.log("Input overrides:", inputOverrides);

    const results = await calculateFormula(id, inputOverrides);

    console.log("Calculation results:", results);

    return NextResponse.json({ results }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Enhanced nested calculate formula error:", error);
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}