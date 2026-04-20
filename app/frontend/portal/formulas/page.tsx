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
    nodes?: unknown[];
    edges?: unknown[];
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
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

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
          <Link href="/frontend/portal/builder">New Formula</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section>
        <h2>Your Formulas</h2>

        {error ? <p style={{ color: "red" }}>{error}</p> : null}
        {deleteError ? <p style={{ color: "red" }}>{deleteError}</p> : null}

        {loading ? (
          <p>Loading formulas...</p>
        ) : formulas.length === 0 ? (
          <div>
            <p>No formulas found yet.</p>
            <Link href="/frontend/portal/builder">Create your first formula</Link>
          </div>
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
                    <strong>Derived Inputs:</strong>
                    {inputList.length > 0 ? (
                      <ul>
                        {inputList.map((input, index) => (
                          <li key={`input-${formula.id}-${index}`}>
                            {input.item} x{input.quantity ?? 1}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No derived inputs</p>
                    )}
                  </div>

                  <div style={{ margin: "12px 0" }}>
                    <strong>Derived Outputs:</strong>
                    {outputList.length > 0 ? (
                      <ul>
                        {outputList.map((output, index) => (
                          <li key={`output-${formula.id}-${index}`}>
                            {output.item} x{output.quantity ?? 1}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No derived outputs</p>
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