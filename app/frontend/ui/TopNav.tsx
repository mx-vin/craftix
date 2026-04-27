"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./TopNav.module.css";

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/frontend/portal/login");
  }

  function linkClass(href: string) {
    return pathname === href ? `${styles.link} ${styles.active}` : styles.link;
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>craftix</div>

      <nav className={styles.nav}>
        <Link href="/frontend/portal/formulas" className={linkClass("/frontend/portal/formulas")}>
          Home
        </Link>

        <Link href="/frontend/portal/profile" className={linkClass("/frontend/portal/profile")}>
          Profile
        </Link>

        <button type="button" className={styles.logout} onClick={handleLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
}