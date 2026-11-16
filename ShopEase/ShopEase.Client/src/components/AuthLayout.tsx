import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="ShopEase introduction">
        <div className="auth-brand">
          <BrandMark />
          <strong>ShopEase</strong>
        </div>
        <div className="visual-copy">
          <span className="eyebrow light">A better way to browse</span>
          <h1>Good finds.<br />Less fuss.</h1>
          <p>
            A thoughtfully organized marketplace built to make every choice
            feel simple.
          </p>
        </div>
        <div className="visual-orbit orbit-one" />
        <div className="visual-orbit orbit-two" />
        <div className="floating-card card-one">
          <span className="mini-icon">⌁</span>
          <span>Easy browsing</span>
        </div>
        <div className="floating-card card-two">
          <span className="mini-icon">✓</span>
          <span>Trusted products</span>
        </div>
        <p className="visual-footer">Shop smart. Live easy.</p>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
