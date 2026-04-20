"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./builder.module.css";

type StoredUser = {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
};

type FormulaVariable = {
  id: string;
  formula_id: string;
  name: string;
  type: string;
  base_value: number;
};

type FormulaData = {
  inputs?: { item: string; quantity?: number }[];
  outputs?: { item: string; quantity?: number }[];
  nodes?: BuilderNode[];
  [key: string]: any;
};

type FormulaRecord = {
  id: string;
  user_id?: string;
  folder_id?: string | null;
  name: string;
  description: string | null;
  data: FormulaData | null;
  created_at?: string;
  updated_at?: string;
};

type GetFormulaResponse = {
  formula?: FormulaRecord;
  variables?: FormulaVariable[];
  links?: unknown[];
  error?: string;
  message?: string;
  success?: boolean;
};

type NodeType = "input" | "output" | "process";

type BuilderNode = {
  id: string;
  variableId?: string;
  type: NodeType;
  label: string;
  quantity: number;
  x: number;
  y: number;
};

type DragState = {
  nodeId: string;
  offsetX: number;
  offsetY: number;
} | null;

function makeNodeId() {
  return `node-${crypto.randomUUID()}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState("");
  const [formulaId, setFormulaId] = useState("");

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFormula, setLoadingFormula] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [formula, setFormula] = useState<FormulaRecord | null>(null);
  const [nodes, setNodes] = useState<BuilderNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const rawToken = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");

    if (!rawToken || !rawUser) {
      router.push("/frontend/portal/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as StoredUser;
      setUser(parsedUser);
      setToken(rawToken);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/frontend/portal/login");
      return;
    }

    const idFromQuery = searchParams.get("formulaId");
    if (idFromQuery) {
      setFormulaId(idFromQuery);
    }

    setLoadingUser(false);
  }, [router, searchParams]);

  useEffect(() => {
    if (!token || !formulaId) return;
    void loadFormula(formulaId, token);
  }, [formulaId, token]);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!dragState || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const nextX = clamp(e.clientX - rect.left - dragState.offsetX, 0, rect.width - 140);
      const nextY = clamp(e.clientY - rect.top - dragState.offsetY, 0, rect.height - 72);

      setNodes((prev) =>
        prev.map((node) =>
          node.id === dragState.nodeId
            ? { ...node, x: nextX, y: nextY }
            : node
        )
      );
    }

    function handlePointerUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState]);

  async function loadFormula(id: string, bearerToken: string) {
    setLoadingFormula(true);
    setError("");
    setSaveSuccess("");
    setSaveError("");

    try {
      const res = await fetch(`/backend/api/formulas/getFormula/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      const text = await res.text();
      let data: GetFormulaResponse | null = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok || !data?.formula) {
        setError(data?.error || data?.message || "Failed to load formula");
        setFormula(null);
        setNodes([]);
        return;
      }

      const loadedFormula = data.formula;
      const loadedVariables = data.variables || [];

      setFormula(loadedFormula);
      setName(loadedFormula.name || "");
      setDescription(loadedFormula.description || "");

      let loadedNodes: BuilderNode[] = [];

      if (Array.isArray(loadedFormula.data?.nodes) && loadedFormula.data?.nodes.length) {
        loadedNodes = loadedFormula.data.nodes.map((node, index) => ({
          id: node.id || makeNodeId(),
          variableId: node.variableId,
          type: node.type,
          label: node.label,
          quantity: node.quantity ?? 1,
          x: node.x ?? 40 + index * 40,
          y: node.y ?? 40 + index * 40,
        }));
      } else {
        const inputVariables = loadedVariables.filter(
          (v) => v.type.toLowerCase() === "input"
        );
        const outputVariables = loadedVariables.filter(
          (v) => v.type.toLowerCase() === "output"
        );

        loadedNodes = [
          ...inputVariables.map((v, index) => ({
            id: makeNodeId(),
            variableId: v.id,
            type: "input" as const,
            label: v.name,
            quantity: v.base_value ?? 1,
            x: 40,
            y: 40 + index * 100,
          })),
          ...outputVariables.map((v, index) => ({
            id: makeNodeId(),
            variableId: v.id,
            type: "output" as const,
            label: v.name,
            quantity: v.base_value ?? 1,
            x: 520,
            y: 40 + index * 100,
          })),
        ];
      }

      setNodes(loadedNodes);
      setSelectedNodeId(loadedNodes[0]?.id ?? null);
    } catch (err: any) {
      setError(err?.message || "Failed to load formula");
      setFormula(null);
      setNodes([]);
    } finally {
      setLoadingFormula(false);
    }
  }

  function addNode(type: NodeType) {
    const countOfType = nodes.filter((n) => n.type === type).length;

    const newNode: BuilderNode = {
      id: makeNodeId(),
      type,
      label:
        type === "input"
          ? `Input ${countOfType + 1}`
          : type === "output"
          ? `Output ${countOfType + 1}`
          : `Process ${countOfType + 1}`,
      quantity: 1,
      x: type === "input" ? 40 : type === "output" ? 520 : 280,
      y: 60 + countOfType * 90,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;

    const next = nodes.filter((node) => node.id !== selectedNodeId);
    setNodes(next);
    setSelectedNodeId(next[0]?.id ?? null);
  }

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  function updateSelectedNode(patch: Partial<BuilderNode>) {
    if (!selectedNodeId) return;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId ? { ...node, ...patch } : node
      )
    );
  }

  function beginDrag(
    e: React.PointerEvent<HTMLDivElement>,
    node: BuilderNode
  ) {
    if (!canvasRef.current) return;

    const nodeRect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - nodeRect.left;
    const offsetY = e.clientY - nodeRect.top;

    setSelectedNodeId(node.id);
    setDragState({
      nodeId: node.id,
      offsetX,
      offsetY,
    });
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formulaId || !token) {
      setSaveError("Missing formula id or token");
      return;
    }

    if (!name.trim()) {
      setSaveError("Formula name is required");
      return;
    }

    const inputNodes = nodes.filter((node) => node.type === "input");
    const outputNodes = nodes.filter((node) => node.type === "output");

    if (inputNodes.length === 0 || outputNodes.length === 0) {
      setSaveError("Formula must have at least one input and one output");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        folder_id: formula?.folder_id ?? null,
        data: {
          ...(formula?.data || {}),
          inputs: inputNodes.map((node) => ({
            item: node.label.trim(),
            quantity: Number(node.quantity) || 1,
          })),
          outputs: outputNodes.map((node) => ({
            item: node.label.trim(),
            quantity: Number(node.quantity) || 1,
          })),
          nodes,
        },
        variables: [
          ...inputNodes.map((node) => ({
            id: node.variableId,
            name: node.label.trim(),
            type: "input",
            base_value: Number(node.quantity) || 1,
          })),
          ...outputNodes.map((node) => ({
            id: node.variableId,
            name: node.label.trim(),
            type: "output",
            base_value: Number(node.quantity) || 1,
          })),
        ],
      };

      const res = await fetch(`/backend/api/formulas/updateFormula/${formulaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok) {
        setSaveError(data?.error || data?.message || "Failed to save formula");
        return;
      }

      setSaveSuccess("Formula saved successfully");
      await loadFormula(formulaId, token);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save formula");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/frontend/portal/login");
  }

  if (loadingUser) {
    return <main className={styles.page}>Loading user...</main>;
  }

  if (!formulaId) {
    return (
      <main className={styles.page}>
        <h1>Builder</h1>
        <p>No formula selected.</p>
        <Link href="/frontend/portal/formulas">Back to Formulas</Link>
      </main>
    );
  }

  if (loadingFormula) {
    return <main className={styles.page}>Loading formula...</main>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Formula Builder</h1>
          <p className={styles.subtitle}>
            Editing as <strong>{user?.username}</strong>
          </p>
        </div>

        <div className={styles.headerLinks}>
          <Link href="/frontend">Home</Link>
          <Link href="/frontend/portal/formulas">Back to Formulas</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.layout}>
        <form className={styles.sidebar} onSubmit={handleSave}>
          <h2>Formula Details</h2>

          <label className={styles.field}>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Description</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className={styles.buttonRow}>
            <button type="button" onClick={() => addNode("input")}>
              Add Input
            </button>
            <button type="button" onClick={() => addNode("process")}>
              Add Process
            </button>
            <button type="button" onClick={() => addNode("output")}>
              Add Output
            </button>
          </div>

          <div className={styles.selectedPanel}>
            <h3>Selected Node</h3>

            {selectedNode ? (
              <>
                <label className={styles.field}>
                  <span>Type</span>
                  <input value={selectedNode.type} disabled />
                </label>

                <label className={styles.field}>
                  <span>Label</span>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) =>
                      updateSelectedNode({ label: e.target.value })
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={selectedNode.quantity}
                    onChange={(e) =>
                      updateSelectedNode({
                        quantity: Number(e.target.value) || 1,
                      })
                    }
                  />
                </label>

                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={deleteSelectedNode}
                >
                  Delete Selected Node
                </button>
              </>
            ) : (
              <p>No node selected.</p>
            )}
          </div>

          <div className={styles.metaPanel}>
            <h3>Formula Summary</h3>
            <p>
              Inputs: {nodes.filter((n) => n.type === "input").length}
            </p>
            <p>
              Processes: {nodes.filter((n) => n.type === "process").length}
            </p>
            <p>
              Outputs: {nodes.filter((n) => n.type === "output").length}
            </p>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Formula"}
          </button>

          {saveError ? <p className={styles.error}>{saveError}</p> : null}
          {saveSuccess ? <p className={styles.success}>{saveSuccess}</p> : null}
        </form>

        <section className={styles.canvasPanel}>
          <div className={styles.canvasHeader}>
            <h2>Canvas</h2>
            <p>Drag nodes to arrange the formula flow.</p>
          </div>

          <div ref={canvasRef} className={styles.canvas}>
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`${styles.node} ${styles[node.type]} ${
                  selectedNodeId === node.id ? styles.selected : ""
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                }}
                onPointerDown={(e) => beginDrag(e, node)}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <div className={styles.nodeType}>{node.type}</div>
                <div className={styles.nodeLabel}>{node.label}</div>
                <div className={styles.nodeQty}>x{node.quantity}</div>
              </div>
            ))}

            {nodes.length === 0 ? (
              <div className={styles.emptyCanvas}>
                Add input, process, or output nodes to begin building.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}