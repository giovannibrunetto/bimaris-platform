"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

export function Footer() {
  const pathname = usePathname();
  const isStoriesLanding = pathname === "/storie-miti-leggende";

  return (
    <footer className={`${styles.footer}${isStoriesLanding ? ` ${styles.storiesFooter}` : ""}`}>
      <Link className={styles.brand} href="/" aria-label="BIMARIS — Messina da Vivere">
        <span className={styles.brandImage} />
      </Link>
      <div className={styles.links}>
        <Link href="/operatori/candidatura">Operatori</Link>
        <Link href="/contatti">Contatti</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/cookie">Cookie</Link>
        <Link href="/note-legali">Note legali</Link>
      </div>
      <p className={styles.copyright}>© 2026 BIMARIS — Messina da Vivere.</p>
    </footer>
  );
}
