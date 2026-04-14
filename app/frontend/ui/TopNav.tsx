import Link from "next/link";
import styles from "./TopNav.module.css";

export default function TopNav() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>craftix</div>

        <nav className={styles.nav}>
          <Link href="/frontend" className={styles.active}>
            Home
          </Link>
          <Link href="/frontend/portal/formulas" className={styles.link}>
            Marketplace
          </Link>
        </nav>

        <button className={styles.settings} type="button">
          ⚙
        </button>
      </div>
    </header>
  );
}