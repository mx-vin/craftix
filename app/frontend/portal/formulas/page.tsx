"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../../ui/TopNav";
import styles from "./formulas.module.css";

type StoredUser = {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
};

type FormulaNode = {
  id: string;
  label: string;
  quantity?: string | number;
  x: number;
  y: number;
};

type FormulaEdge = {
  id: string;
  from: string;
  to: string;
};

type Formula = {
  id: string;
  user_id?: string;
  userId?: string;
  folder_id?: string | null;
  folderId?: string | null;
  name: string;
  description: string | null;
  data: {
    inputs?: { item: string; quantity?: number }[];
    outputs?: { item: string; quantity?: number }[];
    nodes?: FormulaNode[];
    edges?: FormulaEdge[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

type GetAllFormulasResponse = {
  success: boolean;
  formulas?: Formula[];
  error?: string;
  detail?: string;
};

type CalculationResult = {
  success?: boolean;
  used?: Record<string, number>;
  results?: Record<string, number>;
  nodeValues?: Record<string, number>;
  sourceNodes?: string[];
  sinkNodes?: string[];
  scale?: number;
  error?: string;
  message?: string;
};

type FolderGroup = {
  key: string;
  label: string;
  count: number;
};

type CanvasOffset = {
  x: number;
  y: number;
};

type PanState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null;

export default function FormulasPage() {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string>("");
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [selectedFormulaId, setSelectedFormulaId] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");

  const [selectedCalcNodeId, setSelectedCalcNodeId] = useState<string | null>(null);
  const [selectedOverrideValue, setSelectedOverrideValue] = useState<string>("");

  const [calculating, setCalculating] = useState<Record<string, boolean>>({});
  const [calculationErrors, setCalculationErrors] = useState<Record<string, string>>({});
  const [calculationResults, setCalculationResults] = useState<Record<string, CalculationResult>>({});

  const [canvasOffset, setCanvasOffset] = useState<CanvasOffset>({ x: 0, y: 0 });
  const [panState, setPanState] = useState<PanState>(null);

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
    }
  }, [router]);

  useEffect(() => {
    if (!user || !token) return;
    void loadFormulas(user.id, token);
  }, [user, token]);

  useEffect(() => {
    setSelectedCalcNodeId(null);
    setSelectedOverrideValue("");
    setCanvasOffset({ x: 0, y: 0 });
  }, [selectedFormulaId]);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!panState) return;

      const dx = e.clientX - panState.startX;
      const dy = e.clientY - panState.startY;

      setCanvasOffset({
        x: panState.originX + dx,
        y: panState.originY + dy,
      });
    }

    function handlePointerUp() {
      setPanState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [panState]);

  async function loadFormulas(userId: string, bearerToken: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/backend/api/formulas/getAllFormulas/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      const data: GetAllFormulasResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || data.detail || "Failed to load formulas");
        setFormulas([]);
        return;
      }

      const loaded = data.formulas || [];
      setFormulas(loaded);

      if (loaded.length > 0 && !selectedFormulaId) {
        setSelectedFormulaId(loaded[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load formulas");
      setFormulas([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteFormula(formulaId: string) {
    if (!token || !user) return;

    setDeleteError("");

    try {
      const res = await fetch(`/backend/api/formulas/deleteFormula/${formulaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok) {
        setDeleteError(data?.error || data?.message || "Failed to delete formula");
        return;
      }

      await loadFormulas(user.id, token);
      if (selectedFormulaId === formulaId) {
        setSelectedFormulaId("");
      }
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete formula");
    }
  }

  async function handleCalculate(formulaId: string) {
    setCalculationErrors((prev) => ({ ...prev, [formulaId]: "" }));
    setCalculating((prev) => ({ ...prev, [formulaId]: true }));

    try {
      let inputs: Record<string, number> = {};

      if (selectedCalcNodeId && selectedOverrideValue !== "") {
        const selectedNode =
          selectedFormula?.data?.nodes?.find((node) => node.id === selectedCalcNodeId) || null;

        if (!selectedNode) {
          setCalculationErrors((prev) => ({
            ...prev,
            [formulaId]: "Select a node first",
          }));
          setCalculating((prev) => ({ ...prev, [formulaId]: false }));
          return;
        }

        const parsedValue = Number(selectedOverrideValue);

        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
          setCalculationErrors((prev) => ({
            ...prev,
            [formulaId]: "Override value must be a valid non-negative number",
          }));
          setCalculating((prev) => ({ ...prev, [formulaId]: false }));
          return;
        }

        inputs = {
          [selectedNode.label]: parsedValue,
        };
      }

      const res = await fetch(`/backend/api/formulas/calculateFormula/${formulaId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs }),
      });

      const text = await res.text();
      let data: CalculationResult | null = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok) {
        setCalculationErrors((prev) => ({
          ...prev,
          [formulaId]: data?.error || data?.message || "Failed to calculate formula",
        }));
        return;
      }

      setCalculationResults((prev) => ({
        ...prev,
        [formulaId]: data || {},
      }));
    } catch (err: any) {
      setCalculationErrors((prev) => ({
        ...prev,
        [formulaId]: err?.message || "Failed to calculate formula",
      }));
    } finally {
      setCalculating((prev) => ({ ...prev, [formulaId]: false }));
    }
  }

  const folderGroups = useMemo<FolderGroup[]>(() => {
    const map = new Map<string, FolderGroup>();

    for (const formula of formulas) {
      const folderKey = formula.folderId || formula.folder_id || "ungrouped";

      if (!map.has(folderKey)) {
        map.set(folderKey, {
          key: folderKey,
          label: folderKey === "ungrouped" ? "Ungrouped" : `Folder ${folderKey.slice(0, 6)}`,
          count: 0,
        });
      }

      map.get(folderKey)!.count += 1;
    }

    return [
      { key: "all", label: "All Formulas", count: formulas.length },
      ...Array.from(map.values()),
    ];
  }, [formulas]);

  const filteredFormulas = useMemo(() => {
    if (selectedFolder === "all") return formulas;
    return formulas.filter(
      (formula) => (formula.folderId || formula.folder_id || "ungrouped") === selectedFolder
    );
  }, [formulas, selectedFolder]);

  useEffect(() => {
    if (filteredFormulas.length > 0) {
      const exists = filteredFormulas.some((f) => f.id === selectedFormulaId);
      if (!exists) {
        setSelectedFormulaId(filteredFormulas[0].id);
      }
    }
  }, [filteredFormulas, selectedFormulaId]);

  const selectedFormula =
    filteredFormulas.find((formula) => formula.id === selectedFormulaId) || null;

  function getNodeCenter(nodeId: string) {
    const node = selectedFormula?.data?.nodes?.find((n) => n.id === nodeId);
    if (!node) return null;
    return { x: node.x + 88, y: node.y + 48 };
  }

  const selectedCalcNode =
    selectedFormula?.data?.nodes?.find((node) => node.id === selectedCalcNodeId) || null;

  function getNodeDisplayValue(node: FormulaNode) {
    const calculation = selectedFormula ? calculationResults[selectedFormula.id] : null;
    if (!calculation?.nodeValues) return null;
    return calculation.nodeValues[node.id];
  }

  function beginPan(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).dataset.role === "graph-node") return;

    setPanState({
      startX: e.clientX,
      startY: e.clientY,
      originX: canvasOffset.x,
      originY: canvasOffset.y,
    });
  }

  if (!user) {
    return <main className={styles.page}>Loading user...</main>;
  }

  return (
    <main className={styles.page}>
      <TopNav />

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Formulas</h2>
            <Link href="/frontend/portal/builder" className={styles.createButton}>
              + New Formula
            </Link>
          </div>

          <div className={styles.folderSection}>
            <p className={styles.sectionLabel}>Folders</p>
            <div className={styles.folderList}>
              {folderGroups.map((folder) => (
                <button
                  key={folder.key}
                  type="button"
                  className={
                    selectedFolder === folder.key
                      ? `${styles.folderButton} ${styles.folderButtonActive}`
                      : styles.folderButton
                  }
                  onClick={() => setSelectedFolder(folder.key)}
                >
                  <span>{folder.label}</span>
                  <span className={styles.folderCount}>{folder.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formulaSection}>
            <p className={styles.sectionLabel}>Saved Formulas</p>

            {loading ? (
              <p>Loading formulas...</p>
            ) : filteredFormulas.length === 0 ? (
              <p>No formulas found.</p>
            ) : (
              <div className={styles.formulaList}>
                {filteredFormulas.map((formula) => (
                  <button
                    key={formula.id}
                    type="button"
                    className={
                      selectedFormulaId === formula.id
                        ? `${styles.formulaCard} ${styles.formulaCardActive}`
                        : styles.formulaCard
                    }
                    onClick={() => setSelectedFormulaId(formula.id)}
                  >
                    <strong>{formula.name}</strong>
                    <span>{formula.description || "No description"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className={styles.mainPanel}>
          {error ? <p className={styles.error}>{error}</p> : null}
          {deleteError ? <p className={styles.error}>{deleteError}</p> : null}

          {!selectedFormula ? (
            <div className={styles.emptyState}>
              <h2>No formula selected</h2>
              <p>Create one to get started.</p>
              <Link href="/frontend/portal/builder" className={styles.createButton}>
                Create Formula
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.panelHeader}>
                <div>
                  <h1 className={styles.mainTitle}>{selectedFormula.name}</h1>
                  <p className={styles.mainSubtitle}>
                    {selectedFormula.description || "No description"}
                  </p>
                </div>

                <div className={styles.actionRow}>
                  <Link
                    href={`/frontend/portal/builder?formulaId=${selectedFormula.id}`}
                    className={styles.editButton}
                  >
                    Edit Formula
                  </Link>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDeleteFormula(selectedFormula.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className={styles.workspace}>
                <div className={styles.graphPanel}>
                  <div className={styles.graphHeader}>
                    <h3>Formula Graph</h3>
                    <p>Click a node to select it for override. Drag empty space to pan.</p>
                  </div>

                  <div
                    ref={viewportRef}
                    className={styles.graphViewport}
                    onPointerDown={beginPan}
                  >
                    <div
                      className={styles.graphWorld}
                      style={{
                        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                      }}
                    >
                      <svg className={styles.edgeLayer}>
                        {(selectedFormula.data?.edges || []).map((edge) => {
                          const from = getNodeCenter(edge.from);
                          const to = getNodeCenter(edge.to);
                          if (!from || !to) return null;

                          return (
                            <line
                              key={edge.id}
                              x1={from.x}
                              y1={from.y}
                              x2={to.x}
                              y2={to.y}
                              className={styles.edge}
                            />
                          );
                        })}
                      </svg>

                      {(selectedFormula.data?.nodes || []).length > 0 ? (
                        (selectedFormula.data?.nodes || []).map((node) => {
                          const displayValue = getNodeDisplayValue(node);

                          return (
                            <button
                              key={node.id}
                              type="button"
                              data-role="graph-node"
                              className={
                                selectedCalcNodeId === node.id
                                  ? `${styles.graphNode} ${styles.graphNodeSelected}`
                                  : styles.graphNode
                              }
                              style={{
                                left: `${node.x}px`,
                                top: `${node.y}px`,
                              }}
                              onClick={() => {
                                setSelectedCalcNodeId(node.id);
                                setSelectedOverrideValue("");
                              }}
                            >
                              <div className={styles.graphNodeLabel}>{node.label}</div>
                              <div className={styles.graphNodeQty}>
                                x{node.quantity ?? ""}
                              </div>
                              {displayValue !== null && displayValue !== undefined ? (
                                <div className={styles.graphNodeComputed}>
                                  = {displayValue}
                                </div>
                              ) : null}
                            </button>
                          );
                        })
                      ) : (
                        <div className={styles.graphFallback}>
                          No saved graph nodes yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.sideCards}>
                  <div className={styles.infoCard}>
                    <h3>Derived Source Nodes</h3>
                    {(calculationResults[selectedFormula.id]?.sourceNodes || selectedFormula.data?.inputs?.map(i => i.item) || []).length > 0 ? (
                      <ul>
                        {(calculationResults[selectedFormula.id]?.sourceNodes || selectedFormula.data?.inputs?.map(i => i.item) || []).map((item, index) => (
                          <li key={`source-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No source nodes</p>
                    )}
                  </div>

                  <div className={styles.infoCard}>
                    <h3>Derived Final Outputs</h3>
                    {(calculationResults[selectedFormula.id]?.sinkNodes || selectedFormula.data?.outputs?.map(o => o.item) || []).length > 0 ? (
                      <ul>
                        {(calculationResults[selectedFormula.id]?.sinkNodes || selectedFormula.data?.outputs?.map(o => o.item) || []).map((item, index) => (
                          <li key={`sink-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No final outputs</p>
                    )}
                  </div>

                  <div className={styles.infoCard}>
                    <h3>Calculate Formula</h3>

                    {selectedCalcNode ? (
                      <div className={styles.overridePanel}>
                        <p className={styles.overrideLabel}>
                          Selected node: <strong>{selectedCalcNode.label}</strong>
                        </p>

                        <input
                          type="number"
                          min="0"
                          placeholder="Override value"
                          value={selectedOverrideValue}
                          onChange={(e) => setSelectedOverrideValue(e.target.value)}
                        />
                      </div>
                    ) : (
                      <p>Select a graph node to set an override.</p>
                    )}

                    <button
                      type="button"
                      className={styles.calcButton}
                      onClick={() => handleCalculate(selectedFormula.id)}
                      disabled={!!calculating[selectedFormula.id]}
                    >
                      {calculating[selectedFormula.id] ? "Calculating..." : "Calculate"}
                    </button>

                    {calculationErrors[selectedFormula.id] ? (
                      <p className={styles.error}>
                        {calculationErrors[selectedFormula.id]}
                      </p>
                    ) : null}

                    {calculationResults[selectedFormula.id]?.scale !== undefined ? (
                      <p className={styles.scaleText}>
                        Scale: {calculationResults[selectedFormula.id]?.scale}
                      </p>
                    ) : null}

                    {calculationResults[selectedFormula.id]?.used ||
                    calculationResults[selectedFormula.id]?.results ? (
                      <div className={styles.calcResults}>
                        <div>
                          <strong>Used</strong>
                          <ul>
                            {Object.entries(
                              calculationResults[selectedFormula.id]?.used || {}
                            ).map(([key, value]) => (
                              <li key={`used-${key}`}>
                                {key}: {value}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <strong>Results</strong>
                          <ul>
                            {Object.entries(
                              calculationResults[selectedFormula.id]?.results || {}
                            ).map(([key, value]) => (
                              <li key={`result-${key}`}>
                                {key}: {value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}