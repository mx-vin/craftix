"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      router.replace("/frontend/portal/formulas");
    }
  }, [router]);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/backend/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          register: true,
        }),
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok) {
        setError(data?.error || data?.message || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/frontend/portal/formulas");
    } catch (err: any) {
      setError(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>craftix</div>

        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Start building and organizing formulas.</p>

        <form onSubmit={handleRegister} className={styles.form}>
          <label className={styles.field}>
            <span>Username</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}

        <p className={styles.footer}>
          Already have an account?{" "}
          <Link href="/frontend/portal/login" className={styles.link}>
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}