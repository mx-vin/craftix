import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

type GraphNode = {
  id: string;
  label: string;
  quantity?: number | string;
  x?: number;
  y?: number;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
};

type FormulaRow = {
  id: string;
  data: {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    [key: string]: any;
  } | null;
};

function qty(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function topoSort(nodes: GraphNode[], edges: GraphEdge[]) {
  const incomingCount = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    incomingCount.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    incomingCount.set(edge.to, (incomingCount.get(edge.to) || 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }

  const queue = nodes
    .filter((node) => (incomingCount.get(node.id) || 0) === 0)
    .map((node) => node.id);

  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    ordered.push(current);

    for (const next of outgoing.get(current) || []) {
      incomingCount.set(next, (incomingCount.get(next) || 0) - 1);

      if ((incomingCount.get(next) || 0) === 0) {
        queue.push(next);
      }
    }
  }

  if (ordered.length !== nodes.length) {
    throw new Error("Formula graph contains a cycle");
  }

  return ordered;
}

function calculateLayeredGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  overrides: Record<string, number>
) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const incoming = new Map<string, GraphEdge[]>();
  const outgoing = new Map<string, GraphEdge[]>();

  for (const node of nodes) {
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    incoming.get(edge.to)?.push(edge);
    outgoing.get(edge.from)?.push(edge);
  }

  const ordered = topoSort(nodes, edges);
  const reverseOrdered = [...ordered].reverse();

  const sourceNodes = nodes.filter(
    (node) => (incoming.get(node.id) || []).length === 0
  );

  const sinkNodes = nodes.filter(
    (node) => (outgoing.get(node.id) || []).length === 0
  );

  if (sourceNodes.length === 0 || sinkNodes.length === 0) {
    throw new Error("Formula must have at least one source node and one final output node");
  }

  const requiredPerBatch: Record<string, number> = {};

  for (const node of nodes) {
    requiredPerBatch[node.id] = 0;
  }

  // One full formula batch produces each final output node's base quantity.
  for (const sink of sinkNodes) {
    requiredPerBatch[sink.id] += qty(sink.quantity);
  }

  // Work backward from final outputs through every layer.
  for (const childId of reverseOrdered) {
    const child = nodeById.get(childId);
    if (!child) continue;

    const childRequired = requiredPerBatch[childId] || 0;
    if (childRequired <= 0) continue;

    const childBase = qty(child.quantity);
    const childBatches = childRequired / childBase;

    for (const edge of incoming.get(childId) || []) {
      const parent = nodeById.get(edge.from);
      if (!parent) continue;

      requiredPerBatch[parent.id] += childBatches * qty(parent.quantity);
    }
  }

  let scale = Infinity;

  // Overrides can be on ANY node:
  // source, intermediate, or final output.
  for (const [label, rawValue] of Object.entries(overrides)) {
    const overrideValue = Number(rawValue);
    if (!Number.isFinite(overrideValue) || overrideValue < 0) continue;

    const matchingNode = nodes.find((node) => node.label === label);
    if (!matchingNode) continue;

    const required = requiredPerBatch[matchingNode.id] || qty(matchingNode.quantity);
    const factor = Math.floor(overrideValue / required);

    if (factor < scale) {
      scale = factor;
    }
  }

  if (!Number.isFinite(scale)) {
    scale = 1;
  }

  if (scale < 0) {
    scale = 0;
  }

  const nodeValues: Record<string, number> = {};
  const used: Record<string, number> = {};
  const results: Record<string, number> = {};

  for (const node of nodes) {
    nodeValues[node.id] = Math.floor((requiredPerBatch[node.id] || 0) * scale);
  }

  // Used should include ALL required non-final nodes:
  // source nodes + intermediate nodes.
  for (const node of nodes) {
    const isFinalOutput = sinkNodes.some((sink) => sink.id === node.id);

    if (!isFinalOutput) {
      used[node.label] = nodeValues[node.id] || 0;
    }
  }

  // Results only include final output nodes.
  for (const sink of sinkNodes) {
    results[sink.label] = nodeValues[sink.id] || 0;
  }

  return {
    scale,
    used,
    results,
    nodeValues,
    requiredPerBatch,
    sourceNodes: sourceNodes.map((node) => node.label),
    sinkNodes: sinkNodes.map((node) => node.label),
  };
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json(
        { error: "Formula ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const overrides: Record<string, number> = body.inputs || {};

    const rows = await sql<FormulaRow[]>`
      SELECT id, data
      FROM formulas
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    const formula = rows[0];

    if (!formula) {
      return NextResponse.json(
        { error: "Formula not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const nodes = Array.isArray(formula.data?.nodes) ? formula.data.nodes : [];
    const edges = Array.isArray(formula.data?.edges) ? formula.data.edges : [];

    if (nodes.length === 0) {
      return NextResponse.json(
        { error: "Formula has no graph nodes" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (edges.length === 0) {
      return NextResponse.json(
        { error: "Formula has no graph connections" },
        { status: 400, headers: corsHeaders }
      );
    }

    const calculation = calculateLayeredGraph(nodes, edges, overrides);

    return NextResponse.json(
      {
        success: true,
        scale: calculation.scale,
        used: calculation.used,
        results: calculation.results,
        nodeValues: calculation.nodeValues,
        requiredPerBatch: calculation.requiredPerBatch,
        sourceNodes: calculation.sourceNodes,
        sinkNodes: calculation.sinkNodes,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Calculate formula error:", err);

    return NextResponse.json(
      {
        error: "Server error",
        message: err?.message || String(err),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}