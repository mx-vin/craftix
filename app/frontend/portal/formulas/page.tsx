"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
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

export default function FormulasPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string>("");
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [inputItem, setInputItem] = useState("");
  const [inputQuantity, setInputQuantity] = useState("1");
  const [outputItem, setOutputItem] = useState("");
  const [outputQuantity, setOutputQuantity] = useState("1");

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

  async function loadFormulas(userId: string, bearerToken: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/backend/api/formulas/getAllFormulas/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      );

      const data: GetAllFormulasResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || data.detail || "Failed to load formulas");
        setFormulas([]);
        return;
      }

      setFormulas(data.formulas || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load formulas");
      setFormulas([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFormula(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user || !token) {
      setCreateError("You must be logged in");
      return;
    }

    if (!name.trim()) {
      setCreateError("Formula name is required");
      return;
    }

    if (!inputItem.trim() || !outputItem.trim()) {
      setCreateError("Formula must have at least one input and one output");
      return;
    }

    const parsedInputQuantity = Number(inputQuantity) || 1;
    const parsedOutputQuantity = Number(outputQuantity) || 1;

    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/backend/api/formulas/createFormula", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          folderId: null,
          data: {
            inputs: [
              {
                item: inputItem.trim(),
                quantity: parsedInputQuantity,
              },
            ],
            outputs: [
              {
                item: outputItem.trim(),
                quantity: parsedOutputQuantity,
              },
            ],
          },
        }),
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok || !data?.success) {
        setCreateError(data?.error || data?.message || "Failed to create formula");
        return;
      }

      setName("");
      setDescription("");
      setInputItem("");
      setInputQuantity("1");
      setOutputItem("");
      setOutputQuantity("1");

      await loadFormulas(user.id, token);
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create formula");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteFormula(formulaId: string) {
    if (!token || !user) return;

    setDeleteError("");

    try {
      const res = await fetch(
        `/backend/api/formulas/deleteFormula/${formulaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete formula");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/frontend/portal/login");
  }

  const formulaCountText = useMemo(() => {
    if (loading) return "Loading...";
    if (formulas.length === 1) return "1 formula";
    return `${formulas.length} formulas`;
  }, [loading, formulas.length]);

  if (!user) {
    return <main style={{ padding: "24px" }}>Loading user...</main>;
  }

  return (
    <main style={{ padding: "24px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Formulas Dashboard</h1>
          <p style={{ margin: "8px 0 0" }}>
            Signed in as <strong>{user.username}</strong>
          </p>
          <p style={{ margin: "4px 0 0" }}>{formulaCountText}</p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/frontend">Home</Link>
          <Link href="/frontend/portal/builder">Open Builder</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section
        style={{
          border: "1px solid #ccc",
          padding: "16px",
          marginBottom: "24px",
          maxWidth: "800px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create New Formula</h2>

        <form
          onSubmit={handleCreateFormula}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Formula name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <div style={{ borderTop: "1px solid #ddd", paddingTop: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Input</h3>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                placeholder="Input item"
                value={inputItem}
                onChange={(e) => setInputItem(e.target.value)}
                required
              />

              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={inputQuantity}
                onChange={(e) => setInputQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ borderTop: "1px solid #ddd", paddingTop: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Output</h3>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                placeholder="Output item"
                value={outputItem}
                onChange={(e) => setOutputItem(e.target.value)}
                required
              />

              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={outputQuantity}
                onChange={(e) => setOutputQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Formula"}
          </button>
        </form>

        {createError ? (
          <p style={{ color: "red", marginBottom: 0 }}>{createError}</p>
        ) : null}
      </section>

      <section>
        <h2>Your Formulas</h2>

        {error ? <p style={{ color: "red" }}>{error}</p> : null}
        {deleteError ? <p style={{ color: "red" }}>{deleteError}</p> : null}

        {loading ? (
          <p>Loading formulas...</p>
        ) : formulas.length === 0 ? (
          <p>No formulas found yet. Create one above.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
              maxWidth: "900px",
            }}
          >
            {formulas.map((formula) => {
              const createdDisplay = formula.createdAt || formula.created_at;
              const updatedDisplay = formula.updatedAt || formula.updated_at;

              const inputList = formula.data?.inputs || [];
              const outputList = formula.data?.outputs || [];

              return (
                <article
                  key={formula.id}
                  style={{
                    border: "1px solid #ccc",
                    padding: "16px",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
                    {formula.name}
                  </h3>

                  <p style={{ marginTop: 0 }}>
                    {formula.description || "No description"}
                  </p>

                  <p style={{ margin: "8px 0" }}>
                    <strong>ID:</strong> {formula.id}
                  </p>

                  <div style={{ margin: "12px 0" }}>
                    <strong>Inputs:</strong>
                    {inputList.length > 0 ? (
                      <ul>
                        {inputList.map((input, index) => (
                          <li key={`input-${formula.id}-${index}`}>
                            {input.item} x{input.quantity ?? 1}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No inputs</p>
                    )}
                  </div>

                  <div style={{ margin: "12px 0" }}>
                    <strong>Outputs:</strong>
                    {outputList.length > 0 ? (
                      <ul>
                        {outputList.map((output, index) => (
                          <li key={`output-${formula.id}-${index}`}>
                            {output.item} x{output.quantity ?? 1}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No outputs</p>
                    )}
                  </div>

                  <p style={{ margin: "8px 0" }}>
                    <strong>Created:</strong>{" "}
                    {createdDisplay
                      ? new Date(createdDisplay).toLocaleString()
                      : "Unknown"}
                  </p>

                  <p style={{ margin: "8px 0" }}>
                    <strong>Last updated:</strong>{" "}
                    {updatedDisplay
                      ? new Date(updatedDisplay).toLocaleString()
                      : "Unknown"}
                  </p>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <Link href={`/frontend/portal/builder?formulaId=${formula.id}`}>
                      Edit in Builder
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteFormula(formula.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}