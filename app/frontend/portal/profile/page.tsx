"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../../ui/TopNav";
import styles from "./profile.module.css";

type StoredUser = {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState("");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const rawToken = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    const savedDarkMode = localStorage.getItem("craftix-dark-mode");

    setDarkMode(savedDarkMode === "true");

    if (!rawToken || !rawUser) {
      router.push("/frontend/portal/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as StoredUser;
      setUser(parsedUser);
      setToken(rawToken);
      setUsername(parsedUser.username || "");
      setEmail(parsedUser.email || "");
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/frontend/portal/login");
    }
  }, [router]);

function toggleDarkMode() {
  const next = !darkMode;

  setDarkMode(next);
  localStorage.setItem("craftix-dark-mode", String(next));

  if (next) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/frontend/portal/login");
  }

  async function handleSaveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user || !token) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const body: Record<string, string> = {};

      if (username.trim()) body.username = username.trim();
      if (email.trim()) body.email = email.trim();
      if (password.trim()) body.password = password.trim();

      const res = await fetch(`/backend/api/user/editUser/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || "Failed to update account");
        return;
      }

      const updatedUser: StoredUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        is_admin: data.user.is_admin,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPassword("");
      setMessage("Account updated successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to update account");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user || !token) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/backend/api/user/deleteById/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Failed to delete account");
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/frontend/portal/register");
    } catch (err: any) {
      setError(err?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  if (!user) {
    return <main className={styles.page}>Loading profile...</main>;
  }

  return (
    <main className={styles.page}>
      <TopNav />

      <section className={styles.shell}>
        <div className={styles.profileCard}>
          <div>
            <h1 className={styles.title}>Profile</h1>
            <p className={styles.subtitle}>Simple profile placeholder.</p>
          </div>

          <div className={styles.infoBox}>
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
          </div>

          <button
            type="button"
            className={styles.settingsButton}
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </div>
      </section>

      {settingsOpen ? (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Settings</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setSettingsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.settingRow}>
              <div>
                <strong>Dark Mode</strong>
                <p>Toggle the profile/settings page theme.</p>
              </div>

              <button type="button" className={styles.toggleButton} onClick={toggleDarkMode}>
                {darkMode ? "On" : "Off"}
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSaveSettings}>
              <label className={styles.field}>
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>New Password</span>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <button type="submit" className={styles.saveButton} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>

            {message ? <p className={styles.success}>{message}</p> : null}
            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.dangerZone}>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                Logout
              </button>

              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}