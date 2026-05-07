"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Brand tokens ─────────────────────────────────────────────────────────
const INK = "#1F2124";
const TEAL = "#267D85";
const TEAL_DARK = "#1e6970";
const OFFWHITE = "#F5F5F3";
const HAIRLINE = "#E5E5E3";
const MUTED = "#5A5A58";
const MUTED_DARK = "#4A4A48";
const QUIET = "#999";

// ─── Founding spots state ────────────────────────────────────────────────
// Single source of truth. Update these as Eddie onboards businesses.
const LAUNCH_DATE = "6 May 2026";
const TOTAL_FOUNDING_SPOTS = 20;
const BUSINESSES_ONBOARDED = 0;
const SPOTS_REMAINING = TOTAL_FOUNDING_SPOTS - BUSINESSES_ONBOARDED;
// Future: drop website URLs in here as each one goes live and they'll show
// in the transparency bar's links list.
const LIVE_SITES: { name: string; url: string }[] = [];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <main style={{ background: OFFWHITE, color: INK, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{globalCss}</style>

      <Nav />
      <Hero />
      <TransparencyBar />
      <TrustBar />
      <Pain />
      <Stats />
      <HowItWorks />
      <CostComparison />
      <RealConversation />
      <Categories />
      <Pricing />
      <FinalCta />
      <Cta />
      <Footer />
    </main>
  );
}

// ─── Inline global CSS for utilities not covered by Tailwind ──────────────
const globalCss = `
  .dim-h1 { font-size: 68px; font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; color: ${INK}; }
  .dim-h2 { font-size: 36px; font-weight: 700; color: ${INK}; line-height: 1.15; letter-spacing: -0.02em; }
  .dim-h3 { font-size: 32px; font-weight: 700; color: ${INK}; }
  .dim-section-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${TEAL}; font-weight: 600; }
  .dim-link-arrow { color: ${TEAL}; font-size: 24px; }
  .dim-text-link:hover { text-decoration: underline; }
  .dim-nav-link { transition: color 0.15s; }
  .dim-nav-link:hover { color: ${INK} !important; }
  .dim-cta-input::placeholder { color: rgba(255,255,255,0.3); }
  .dim-cta-input:focus { border-color: ${TEAL} !important; outline: none; }
  .dim-phone-link { color: white; transition: color 0.15s; }
  .dim-phone-link:hover { color: ${TEAL}; }
  .dim-btn-outline:hover { background: ${INK} !important; color: white !important; }
  .dim-btn-teal:hover { background: ${TEAL_DARK} !important; }
  .dim-btn-ink:hover { background: #2c2f33 !important; }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .dim-pulse { animation: pulse 2s infinite; }

  /* Soft glow halo on founding-spot indicators */
  @keyframes haloGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(38,125,133, 0.45); }
    50% { box-shadow: 0 0 0 8px rgba(38,125,133, 0); }
  }
  .dim-halo { animation: haloGlow 2.4s infinite; }

  /* Slow horizontal gradient flow - used as a thin ribbon at the top of
     the transparency bar. Subtle, calm, brand-aligned. */
  @keyframes flow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  .dim-flow {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(38,125,133,0.0) 10%,
      rgba(38,125,133,0.55) 25%,
      rgba(31,33,36,0.4) 50%,
      rgba(38,125,133,0.55) 75%,
      rgba(38,125,133,0.0) 90%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: flow 9s linear infinite;
  }

  /* Soft drifting radial glow behind the hero headline */
  @keyframes drift {
    0%   { transform: translate(-50%, -50%) translate(-30px, 0px); }
    50%  { transform: translate(-50%, -50%) translate(30px, -10px); }
    100% { transform: translate(-50%, -50%) translate(-30px, 0px); }
  }
  .dim-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 720px;
    height: 380px;
    background: radial-gradient(closest-side, rgba(38,125,133,0.18), rgba(38,125,133,0) 70%);
    filter: blur(20px);
    z-index: 0;
    pointer-events: none;
    animation: drift 14s ease-in-out infinite;
  }

  /* Scroll-triggered fade-up. Default state hides; .dim-in reveals. */
  .dim-fade {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.7s ease, transform 0.7s ease;
    will-change: opacity, transform;
  }
  .dim-fade.dim-in { opacity: 1; transform: translateY(0); }

  /* Tile lift - used on the category grid */
  .dim-cat-tile {
    transition: border-color 0.18s, color 0.18s, transform 0.18s, box-shadow 0.18s;
  }
  .dim-cat-tile:hover {
    border-color: ${TEAL} !important;
    color: ${TEAL} !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(31,33,36,0.06);
  }

  /* Pricing cards lift slightly on hover */
  .dim-tier { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .dim-tier:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(31,33,36,0.08); }
  .dim-tier-featured:hover { box-shadow: 0 12px 32px rgba(38,125,133,0.18); }

  /* Stat number - slight upward swell when in view */
  @keyframes swell {
    0% { transform: scale(0.96); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  .dim-swell { animation: swell 0.6s ease-out both; }

  /* Distant teal glow used inside content sections. Two animations on a
     single element: slow drift + slow breath/pulse. Fades in on intersect
     by toggling the .dim-glow-on class. */
  @keyframes glowDrift {
    0%   { transform: translate(-30px, 0px); }
    50%  { transform: translate(40px, -16px); }
    100% { transform: translate(-30px, 0px); }
  }
  @keyframes glowBreath {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1.05; }
  }
  .dim-section-glow {
    position: absolute;
    pointer-events: none;
    z-index: 0;
    opacity: 0;
    transition: opacity 1.6s ease;
    will-change: opacity, transform;
  }
  .dim-section-glow .dim-section-glow-inner {
    width: 100%;
    height: 100%;
    filter: blur(36px);
    animation: glowDrift 16s ease-in-out infinite, glowBreath 7s ease-in-out infinite;
  }
  .dim-section-glow.dim-glow-on { opacity: 1; }

  /* Progress shimmer - a soft teal sheen that crosses the empty progress
     bar to telegraph "things are happening" even when fill is 0. */
  @keyframes shimmer {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(420%); }
  }
  .dim-progress-shimmer::before {
    content: "";
    position: absolute;
    top: 0; bottom: 0; left: 0;
    width: 28%;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(38,125,133,0.0) 10%,
      rgba(38,125,133,0.32) 50%,
      rgba(38,125,133,0.0) 90%,
      transparent 100%);
    animation: shimmer 3.6s ease-in-out infinite;
  }
  .dim-section-rel { position: relative; overflow: hidden; }
  .dim-stack-on-mobile { display: contents; }
  @media (max-width: 768px) {
    .dim-nav-menu { display: none !important; }
    .dim-h1 { font-size: 42px !important; }
    .dim-h2 { font-size: 28px !important; }
    .dim-hero-pad { padding: 56px 24px 48px !important; }
    .dim-hero-sub { font-size: 17px !important; }
    .dim-arrow { display: none !important; }
    .dim-steps { flex-direction: column !important; }
    .dim-cards { grid-template-columns: 1fr !important; }
    .dim-pricing { grid-template-columns: 1fr !important; }
    .dim-convo { grid-template-columns: 1fr !important; }
    .dim-convo-right { padding-left: 0 !important; margin-top: 32px !important; }
    .dim-cta-h { font-size: 32px !important; }
    .dim-phone-num { font-size: 40px !important; }
    .dim-cta-form-row { grid-template-columns: 1fr !important; }
    .dim-hero-cta-primary { width: 100% !important; }
    .dim-stats { grid-template-columns: 1fr !important; gap: 40px !important; }
    .dim-stat-divider { display: none !important; }
    .dim-num { font-size: 48px !important; }
    .dim-table { display: none !important; }
    .dim-table-mobile { display: block !important; }
    .dim-cta-bottom {
      flex-direction: column !important;
      align-items: stretch !important;
      padding: 0 !important;
      gap: 0 !important;
    }
    .dim-cta-phone-input {
      width: 100% !important;
      padding: 12px 16px !important;
      border-bottom: 1px solid #F0F0EE !important;
    }
    .dim-cta-send {
      width: 100% !important;
      border-radius: 0 0 10px 10px !important;
      padding: 14px !important;
    }
    .dim-cta-textarea { min-height: 80px !important; }
    .dim-transparency-inner {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }
    .dim-tx-note { display: none !important; }
    .dim-tx-progress { width: 120px !important; }
  }
  @media (max-width: 640px) {
    .dim-cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (min-width: 641px) and (max-width: 1024px) {
    .dim-cat-grid { grid-template-columns: repeat(3, 1fr) !important; }
  }
`;

// ─── Animated primitives ──────────────────────────────────────────────────

// Counts up from 0 to `target` once the element enters the viewport.
// Eases out cubic over `durationMs`. Triggers exactly once.
function CountUp({
  target,
  durationMs = 1400,
  prefix = "",
  suffix = "",
  format = (n: number) => Math.round(n).toLocaleString(),
}: {
  target: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const t0 = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - t0) / durationMs);
              const eased = 1 - Math.pow(1 - t, 3);
              setVal(target * eased);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, durationMs]);

  return (
    <span ref={ref}>
      {prefix}
      {format(val)}
      {suffix}
    </span>
  );
}

// Fade + slide up when child enters viewport.
function FadeUp({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setTimeout(() => setShown(true), delay);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  // Cast through unknown to keep TS happy across the dynamic tag.
  const Element = Tag as unknown as React.ElementType;
  return (
    <Element
      ref={ref as unknown as React.RefObject<HTMLElement>}
      className={`dim-fade ${shown ? "dim-in" : ""} ${className}`}
      style={style}
    >
      {children}
    </Element>
  );
}

// SectionGlow: a slow-drifting, slow-breathing teal glow that fades in
// when its parent section enters the viewport. Position with x/y as
// percentages of the section box. Used to break up the page's flatness.
function SectionGlow({
  x = "50%",
  y = "50%",
  size = 720,
  intensity = 0.18,
}: {
  x?: string;
  y?: string;
  size?: number;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setOn(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`dim-section-glow ${on ? "dim-glow-on" : ""}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
    >
      <div
        className="dim-section-glow-inner"
        style={{
          background: `radial-gradient(closest-side, rgba(38,125,133,${intensity}), rgba(38,125,133,0) 70%)`,
        }}
      />
    </div>
  );
}

// ─── Transparency bar ─────────────────────────────────────────────────────
function TransparencyBar() {
  const fillPct = (BUSINESSES_ONBOARDED / TOTAL_FOUNDING_SPOTS) * 100;

  return (
    <section
      className="dim-transparency"
      style={{
        background: "white",
        borderTop: `1px solid ${HAIRLINE}`,
        borderBottom: `1px solid ${HAIRLINE}`,
        padding: "14px 24px",
        width: "100%",
      }}
    >
      <div
        className="dim-transparency-inner"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 40,
          flexWrap: "wrap",
        }}
      >
        {/* Item 1 - Live since */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="dim-pulse"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: TEAL,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: QUIET,
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              Live since
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginTop: 2 }}>
              {LAUNCH_DATE}
            </div>
          </div>
        </div>

        {/* Item 2 - Founding spots filled */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: QUIET,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Founding spots filled
          </div>
          <div
            className="dim-tx-progress"
            style={{
              width: 240,
              height: 6,
              background: "#F0F0EE",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${fillPct}%`,
                height: "100%",
                background: TEAL,
                borderRadius: 3,
                transition: "width 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
            }}
          >
            <CountUp target={BUSINESSES_ONBOARDED} durationMs={1100} /> / {TOTAL_FOUNDING_SPOTS}
          </div>
        </div>

        {/* Item 3 - Right side note (hidden on mobile) */}
        <div
          className="dim-tx-note"
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: QUIET,
            maxWidth: 280,
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          {LIVE_SITES.length > 0 ? (
            <>
              {LIVE_SITES.map((s, i) => (
                <Fragment key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: TEAL, textDecoration: "none", fontWeight: 600 }}
                  >
                    {s.name}
                  </a>
                  {i < LIVE_SITES.length - 1 ? ", " : ""}
                </Fragment>
              ))}
            </>
          ) : (
            <>
              We'll add links to each live site here as we open them up - so
              you can see our work.
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Section 1 - Nav ──────────────────────────────────────────────────────
function Nav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(253,254,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${HAIRLINE}`,
        height: 60,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          height: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" aria-label="Dimmlo home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" height="24" alt="Dimmlo" style={{ display: "block", height: 24 }} />
        </Link>

        {/* Centered menu - desktop only */}
        <div
          className="dim-nav-menu"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          <a
            href="#how-it-works"
            onClick={smoothScrollTo("#how-it-works")}
            className="dim-nav-link"
            style={{
              fontSize: 14,
              color: MUTED_DARK,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            How it works
          </a>
          <a
            href="#pricing"
            onClick={smoothScrollTo("#pricing")}
            className="dim-nav-link"
            style={{
              fontSize: 14,
              color: MUTED_DARK,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Pricing
          </a>
          <a
            href="#examples"
            onClick={smoothScrollTo("#examples")}
            className="dim-nav-link"
            style={{
              fontSize: 14,
              color: MUTED_DARK,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Examples
          </a>
        </div>

        <a
          href="#cta"
          onClick={smoothScrollTo("#cta")}
          className="dim-btn-ink"
          style={{
            background: INK,
            color: "white",
            fontSize: 13,
            padding: "8px 16px",
            borderRadius: 6,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Let's get started
        </a>
      </div>
    </nav>
  );
}

// ─── Section 2 - Hero (with above-the-fold lead form) ────────────────────
// Strong teal radial glow on the section background, plus a secondary
// ambient glow div behind the content. All hero content sits on z-index 1.
function Hero() {
  return (
    <section
      className="dim-hero-pad"
      style={{
        // Primary glow emanating from top-center, fading to off-white base.
        background: `
          radial-gradient(
            ellipse 80% 60% at 50% 0%,
            rgba(38, 125, 133, 0.18) 0%,
            rgba(38, 125, 133, 0.08) 40%,
            rgba(245, 245, 243, 0) 70%
          ),
          ${OFFWHITE}
        `,
        padding: "80px 24px 64px",
        position: "relative",
        overflow: "hidden",
        // Fill the viewport below the sticky 60px nav so the transparency
        // bar always sits below the fold. Centre content vertically.
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Secondary ambient glow lower in the section */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 600,
          height: 400,
          background:
            "radial-gradient(circle, rgba(38, 125, 133, 0.10) 0%, transparent 70%)",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1 className="dim-h1">
          Your business online,
          <br />
          always up to date.
        </h1>

        <p
          className="dim-hero-sub"
          style={{
            fontSize: 20,
            color: MUTED,
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: 480,
            margin: "20px auto 0",
          }}
        >
          Text or call us. We build your site and keep it fresh.
        </p>

        <div style={{ marginTop: 32 }}>
          <LeadForm theme="light" />
        </div>
      </div>
    </section>
  );
}

// ─── Section 3 - Trust bar ────────────────────────────────────────────────
function TrustBar() {
  const items = [
    "We build your site free - you pay only when you're happy",
    "Only 20 founding spots available",
    "Text or call to get started - your choice",
  ];
  return (
    <section
      style={{
        background: "white",
        borderTop: `1px solid ${HAIRLINE}`,
        borderBottom: `1px solid ${HAIRLINE}`,
        padding: "18px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          flexWrap: "wrap",
          fontSize: 13,
          color: MUTED_DARK,
        }}
      >
        {items.map((it) => (
          <span key={it} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: TEAL, fontWeight: 700 }}>✓</span>
            {it}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Section 4 - The pain ─────────────────────────────────────────────────
function Pain() {
  const cards: { heading: string; body: string; teal?: boolean }[] = [
    {
      heading: "It ends up out of date",
      body:
        "Hours change. Prices change. Services change. But updating the site means logging into something, finding the right page, and hoping it looks right. Most owners open the tab and close it again.",
    },
    {
      heading: "You're busy running a business",
      body:
        "You're a plumber, a chef, a trainer - not a web designer. Your time goes where it should. The website just quietly falls behind.",
    },
    {
      heading: "So customers go elsewhere",
      body:
        "Not because your work isn't great. Because someone else looks more current, more active, more on top of it. First impressions happen online now.",
      teal: true,
    },
  ];
  return (
    <section className="dim-section-rel" style={{ background: OFFWHITE, padding: "96px 24px" }}>
      <SectionGlow x="92%" y="20%" size={620} intensity={0.14} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto" }}>
        <span className="dim-section-label">The problem</span>
        <h2 className="dim-h2" style={{ marginTop: 12, maxWidth: 560 }}>
          Every small business has the same problem online.
        </h2>
        <p
          style={{
            fontSize: 16,
            color: MUTED,
            maxWidth: 520,
            marginTop: 12,
            lineHeight: 1.6,
          }}
        >
          Most small business owners are brilliant at what they do. Keeping
          a website current is a different skill entirely - and nobody has
          time for it.
        </p>

        <div
          className="dim-cards"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            marginTop: 56,
          }}
        >
          {cards.map((c) => (
            <div
              key={c.heading}
              style={{
                background: "white",
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 12,
                padding: 32,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: c.teal ? TEAL : INK,
                  borderRadius: 2,
                  marginBottom: 20,
                }}
              />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: INK }}>{c.heading}</h3>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 10 }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats section ────────────────────────────────────────────────────────
function Stats() {
  const stats: { target: number; suffix: string; label: string; source: string }[] = [
    {
      target: 75,
      suffix: "%",
      label:
        "of consumers have skipped a business because its website looked out of date",
      source: "HostingAdvice Survey, 2024",
    },
    {
      target: 92,
      suffix: "%",
      label:
        "feel more confident in a business when its website works smoothly and feels current",
      source: "HostingAdvice Survey, 2024",
    },
    {
      target: 50,
      suffix: "ms",
      label:
        "is all it takes for a customer to form an opinion about your website - and decide whether to trust you",
      source: "Google UX Research",
    },
  ];

  return (
    <section className="dim-section-rel" style={{ background: INK, padding: "72px 24px", color: "white" }}>
      <SectionGlow x="50%" y="50%" size={780} intensity={0.20} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <div
          className="dim-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
            alignItems: "start",
            gap: 24,
          }}
        >
          {stats.map((s, i) => (
            <Fragment key={i}>
              <FadeUp delay={i * 120} style={{ textAlign: "center", padding: "0 8px" }}>
                <div
                  className="dim-num dim-swell"
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    color: "white",
                    lineHeight: 1,
                    backgroundImage:
                      "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.78) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <CountUp target={s.target} suffix={s.suffix} durationMs={1500} />
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.6)",
                    maxWidth: 200,
                    margin: "16px auto 0",
                    lineHeight: 1.5,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                    marginTop: 12,
                  }}
                >
                  {s.source}
                </p>
              </FadeUp>
              {i < stats.length - 1 && (
                <div
                  className="dim-stat-divider"
                  style={{
                    width: 1,
                    alignSelf: "stretch",
                    background: "rgba(255,255,255,0.1)",
                  }}
                  aria-hidden
                />
              )}
            </Fragment>
          ))}
        </div>

        <p
          style={{
            marginTop: 48,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 600,
            color: "white",
            maxWidth: 500,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.4,
          }}
        >
          A stale website doesn't just look bad. It costs you customers.
        </p>
      </div>
    </section>
  );
}

// ─── Section 5 - How it works ─────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: "01",
      h: "Text or call us",
      b: "Tell us about your business - what you do, your hours, what customers always ask. Text it over or jump on a quick call. That's all we need to build your site.",
    },
    {
      n: "02",
      h: "Your site is live in 48 hours",
      b: "We build it from your message. You get a preview link over text. If it looks right, we hit publish. If not, we fix it. You don't pay until you've approved it.",
    },
    {
      n: "03",
      h: "Keep it alive - just text us",
      b: "New hours. New photos. A job you're proud of. Something exciting coming up. A new service. Just text us - we update your site, Google listing, and socials. Your website stays alive and working for you.",
    },
  ];

  return (
    <section id="how-it-works" className="dim-section-rel" style={{ background: "white", padding: "96px 24px" }}>
      <SectionGlow x="10%" y="80%" size={580} intensity={0.13} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <span className="dim-section-label">How it works</span>
        <h2 className="dim-h2" style={{ marginTop: 12 }}>
          One call. Your site is live in 48 hours.
        </h2>

        <div
          className="dim-steps"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 12,
            marginTop: 48,
          }}
        >
          {steps.map((s, i) => (
            <Fragment key={s.n}>
              <div style={{ flex: 1, padding: 32, position: "relative" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: "#E8E8E6", lineHeight: 1 }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: INK, marginTop: 16 }}>
                  {s.h}
                </h3>
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 10 }}>
                  {s.b}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="dim-arrow"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: TEAL,
                    fontSize: 24,
                  }}
                  aria-hidden
                >
                  →
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Cost comparison ──────────────────────────────────────────────────────
function CostComparison() {
  const rows = [
    {
      option: "Web Agency",
      build: "$2,000-$9,000",
      monthly: "$100-$500",
      updates: "Hourly rate",
      stays: "Only if you chase them",
    },
    {
      option: "Freelancer",
      build: "$1,500-$8,000",
      monthly: "$50-$200",
      updates: "Hourly rate",
      stays: "Rarely",
    },
    {
      option: "Wix / Squarespace",
      build: "Free-$500 + hours of your own time and effort",
      monthly: "$16-$29",
      updates: "Hours of your time (you never get around to)",
      stays: "Only if you log in",
    },
  ];
  const dimmlo = {
    option: "Dimmlo",
    build: "Free / a short phone call and text messages",
    monthly: "From $14.99",
    updates: "A text message",
    stays: "Always",
  };

  const headerCellStyle: React.CSSProperties = {
    background: OFFWHITE,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#888",
    fontWeight: 600,
    padding: "16px 20px",
    textAlign: "left",
  };
  const cellStyle: React.CSSProperties = {
    padding: "16px 20px",
    fontSize: 14,
    color: INK,
    borderBottom: "1px solid #F0F0EE",
  };

  return (
    <section className="dim-section-rel" style={{ background: "white", padding: "96px 24px" }}>
      <SectionGlow x="92%" y="30%" size={560} intensity={0.13} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto" }}>
        <span className="dim-section-label">The cost of alternatives</span>
        <h2 className="dim-h2" style={{ marginTop: 12 }}>
          You're probably paying more for less.
        </h2>
        <p
          style={{
            fontSize: 16,
            color: MUTED,
            marginTop: 12,
            maxWidth: 600,
            lineHeight: 1.6,
          }}
        >
          Most small businesses spend $2,000-$9,000 getting a site built,
          then pay to maintain it - and it still goes out of date. Here's
          how that compares.
        </p>

        {/* Desktop table */}
        <div
          className="dim-table"
          style={{
            marginTop: 40,
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Option</th>
                <th style={headerCellStyle}>Build cost</th>
                <th style={headerCellStyle}>Monthly cost</th>
                <th style={headerCellStyle}>Cost of updating</th>
                <th
                  style={{
                    ...headerCellStyle,
                    background: "#F0FAF9",
                    color: TEAL,
                  }}
                >
                  Stays current
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.option}>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{r.option}</td>
                  <td style={cellStyle}>{r.build}</td>
                  <td style={cellStyle}>{r.monthly}</td>
                  <td style={cellStyle}>{r.updates}</td>
                  <td style={{ ...cellStyle, background: "#F0FAF9" }}>{r.stays}</td>
                </tr>
              ))}
              {/* Dimmlo row */}
              <tr>
                <td style={{ ...cellStyle, fontWeight: 600, borderBottom: "none" }}>
                  {dimmlo.option}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    color: TEAL,
                    fontWeight: 700,
                    borderBottom: "none",
                  }}
                >
                  {dimmlo.build}
                </td>
                <td style={{ ...cellStyle, color: TEAL, fontWeight: 700, borderBottom: "none" }}>{dimmlo.monthly}</td>
                <td
                  style={{
                    ...cellStyle,
                    color: TEAL,
                    fontWeight: 700,
                    borderBottom: "none",
                  }}
                >
                  {dimmlo.updates}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    background: "#F0FAF9",
                    color: TEAL,
                    fontWeight: 700,
                    borderBottom: "none",
                  }}
                >
                  {dimmlo.stays}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="dim-table-mobile" style={{ display: "none", marginTop: 32 }}>
          {[...rows, dimmlo].map((r) => {
            const isDimmlo = r.option === "Dimmlo";
            return (
              <div
                key={r.option}
                style={{
                  background: isDimmlo ? "#F0FAF9" : "white",
                  border: `1px solid ${isDimmlo ? TEAL : HAIRLINE}`,
                  borderRadius: 10,
                  padding: 20,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isDimmlo ? TEAL : INK,
                    marginBottom: 12,
                  }}
                >
                  {r.option}
                </div>
                <CostRow label="Build cost" value={r.build} highlight={isDimmlo} />
                <CostRow label="Monthly" value={r.monthly} highlight={isDimmlo} />
                <CostRow label="Cost of updating" value={r.updates} highlight={isDimmlo} />
                <CostRow label="Stays current" value={r.stays} highlight={isDimmlo} />
              </div>
            );
          })}
        </div>

        <p
          style={{
            marginTop: 32,
            textAlign: "center",
            fontSize: 11,
            color: "#B0B0AE",
            lineHeight: 1.5,
          }}
        >
          Build cost data: GoodFirms Web Development Cost Survey 2024.
          Platform pricing: Wix/Squarespace published pricing, 2026.
        </p>
        <p
          style={{
            marginTop: 8,
            textAlign: "center",
            fontSize: 11,
            color: TEAL,
            fontWeight: 500,
          }}
        >
          Dimmlo founding price $14.99/mo - 20 spots available at this price.
        </p>
      </div>
    </section>
  );
}

function CostRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "8px 0",
        borderTop: `1px solid ${HAIRLINE}`,
      }}
    >
      <span style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          color: highlight ? TEAL : INK,
          fontWeight: highlight ? 700 : 500,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Section 6 - Real conversation ────────────────────────────────────────
function RealConversation() {
  return (
    <section id="examples" className="dim-section-rel" style={{ background: OFFWHITE, padding: "96px 24px" }}>
      <SectionGlow x="50%" y="100%" size={680} intensity={0.14} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <span className="dim-section-label">What it looks like</span>
        <h2 className="dim-h2" style={{ marginTop: 12, maxWidth: 480 }}>
          A real update takes four words.
        </h2>

        <div
          className="dim-convo"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 56,
            alignItems: "start",
          }}
        >
          <MessageThread />
          <BehindTheScenes />
        </div>
      </div>
    </section>
  );
}

function MessageThread() {
  return (
    <div
      style={{
        background: "white",
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 16,
        padding: "20px 16px",
        maxWidth: 360,
        width: "100%",
      }}
    >
      <div
        style={{
          textAlign: "center",
          borderBottom: "1px solid #F0F0EE",
          paddingBottom: 12,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#C5C5C3",
            marginRight: 6,
            verticalAlign: "middle",
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: INK, verticalAlign: "middle" }}>
          Dimmlo
        </span>
      </div>

      <Bubble side="received">Finished a big job this week?</Bubble>
      <Bubble side="sent">Yeah full rewire in Cobble Hill, came out great</Bubble>
      <PhotoAttachment count={3} />
      <Timestamp>Just now</Timestamp>
      <Bubble side="received">
        Love it - adding the photos to your site and writing it up. Want me
        to post on Instagram too?
      </Bubble>
      <Bubble side="sent">Go for it</Bubble>
      <Bubble side="received">
        Done. Site updated, Google post live, Instagram scheduled for
        tomorrow morning.
      </Bubble>
    </div>
  );
}

function Bubble({ side, children }: { side: "sent" | "received"; children: React.ReactNode }) {
  const isSent = side === "sent";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isSent ? "flex-end" : "flex-start",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.4,
          background: isSent ? INK : "#F0F0EE",
          color: isSent ? "white" : INK,
          borderRadius: isSent ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Small attachment chip that sits below a "sent" bubble to simulate photos
// being shared in a real text conversation.
function PhotoAttachment({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -2, marginBottom: 8 }}>
      <div
        style={{
          background: "#F4F4F2",
          color: "#999",
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #ECECE9",
        }}
      >
        📎 {count} photos attached
      </div>
    </div>
  );
}

function Timestamp({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 11,
        color: QUIET,
        margin: "4px 0",
      }}
    >
      {children}
    </div>
  );
}

function BehindTheScenes() {
  const items = [
    "Job photos added to website with write-up",
    "Google Business Profile post published",
    "Instagram post scheduled for 9am",
  ];

  return (
    <div className="dim-convo-right" style={{ paddingLeft: 48 }}>
      <span
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: TEAL,
          fontWeight: 600,
        }}
      >
        Behind the scenes
      </span>
      <h3 style={{ fontSize: 28, fontWeight: 700, color: INK, marginTop: 8, lineHeight: 1.2 }}>
        Danny sent four words.
      </h3>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginTop: 12 }}>
        In the time it took Danny to text back, we updated his website with
        the job photos, wrote a short case study for his Google Business
        Profile, and scheduled an Instagram post for the next morning.
      </p>

      <div style={{ marginTop: 24 }}>
        {items.map((it) => (
          <div
            key={it}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: TEAL,
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ✓
            </span>
            <span style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{it}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: QUIET, marginTop: 20, fontStyle: "italic" }}>
        Total time for Danny: about 4 words and 10 seconds.
      </p>
    </div>
  );
}

// ─── Section 7 - Categories ───────────────────────────────────────────────
function Categories() {
  // Flat list. All tiles informational - no clicks, no hovers, no links.
  const categories = [
    "Plumber",
    "Electrician",
    "Handyman",
    "Locksmith",
    "Painter",
    "Cleaning Service",
    "Cafe",
    "Bar",
    "Restaurant",
    "Personal Trainer",
    "Independent Doctor",
    "Physiotherapist",
    "Hair Salon",
    "Pet Groomer",
    "Tattoo Studio",
    "Gym & Fitness",
    "Yoga Studio",
    "Barber",
    "Accountant",
    "Solicitor",
    "Childcare",
    "Tutor",
  ];

  return (
    <section className="dim-section-rel" style={{ background: "white", padding: "80px 24px" }}>
      <SectionGlow x="8%" y="35%" size={540} intensity={0.12} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <span className="dim-section-label">Who it's for</span>
        <h2 className="dim-h3" style={{ marginTop: 12 }}>
          Is this you?
        </h2>
        <p style={{ fontSize: 16, color: MUTED, marginTop: 10, lineHeight: 1.6 }}>
          If you run a service business anywhere in the US and struggle to
          keep your digital presence current, Dimmlo is for you.
        </p>

        <div
          className="dim-cat-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 10,
            marginTop: 32,
          }}
        >
          {categories.map((c) => (
            <div
              key={c}
              style={{
                background: "white",
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 8,
                padding: "12px 16px",
                textAlign: "center",
                fontSize: 14,
                fontWeight: 500,
                color: INK,
                cursor: "default",
              }}
            >
              {c}
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 32,
            fontSize: 14,
            color: MUTED,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Not sure if this is for you?{" "}
          <a
            href="sms:+10000000000?body=Hi, is Dimmlo right for my business?"
            style={{ color: TEAL, textDecoration: "none", fontWeight: 600 }}
          >
            Text us
          </a>{" "}
          and we'll tell you honestly.
        </p>
      </div>
    </section>
  );
}

// ─── Section 8 - Pricing (single price + add-ons) ────────────────────────
function Pricing() {
  // Founding-price counters specific to the pricing card.
  const TOTAL_FOUNDING_PRICE_SPOTS = 20;
  const FOUNDING_PRICE_REMAINING = 20;

  // What's included in the base price.
  const features = [
    "Custom website built from your call",
    "Live in 48 hours",
    "Unlimited text updates",
    "Google Business Profile kept current",
    "Mobile-optimised and fast",
    "Hosted and maintained - nothing to manage",
  ];

  // Optional paid extras stacked beneath the included list.
  const addons = [
    {
      name: "Social posting",
      desc: "3-4 posts/week across Instagram, Facebook and Google, written in your voice",
      price: "+$15/mo",
    },
    {
      name: "AI receptionist",
      desc: "Handles customer enquiries 24/7, books calls, answers FAQs",
      price: "+$25/mo",
    },
  ];

  return (
    <section id="pricing" className="dim-section-rel" style={{ background: OFFWHITE, padding: "72px 24px" }}>
      <SectionGlow x="50%" y="55%" size={760} intensity={0.16} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <span className="dim-section-label">Pricing</span>
        <h2 className="dim-h2" style={{ marginTop: 12 }}>
          One price. No surprises.
        </h2>
        <p style={{ fontSize: 16, color: MUTED, marginTop: 10, lineHeight: 1.6 }}>
          We build your site for free. You only start paying when it's live
          and you're happy.
        </p>

        {/* Founding spots banner - same visual treatment as before */}
        <div
          style={{
            marginTop: 40,
            background: "#FFF8E7",
            border: "1px solid #F0D060",
            borderRadius: 10,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 560,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <span style={{ color: "#D4A017", fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
            ✦
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>
              Founding price - locked in for life
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
              The first 20 businesses pay $14.99/mo forever. After that, the
              price goes to $29.99/mo.
            </div>
          </div>
        </div>

        {/* Spots remaining indicator */}
        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 13,
            color: TEAL,
            fontWeight: 500,
          }}
        >
          <span
            className="dim-halo"
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: TEAL,
              marginRight: 8,
              verticalAlign: "middle",
            }}
          />
          20 founding spots -{" "}
          <CountUp target={FOUNDING_PRICE_REMAINING} durationMs={1100} /> remaining. Be one of the first.
        </div>

        {/* Single price card */}
        <div
          className="dim-tier dim-tier-featured"
          style={{
            position: "relative",
            background: "white",
            borderRadius: 16,
            padding: 24,
            border: `2px solid ${TEAL}`,
            boxShadow: "0 4px 20px rgba(38,125,133,0.10)",
            maxWidth: 480,
            margin: "32px auto 0",
          }}
        >
          {/* "Most popular" badge */}
          <span
            style={{
              position: "absolute",
              top: -13,
              left: "50%",
              transform: "translateX(-50%)",
              background: "white",
              border: `1px solid ${TEAL}`,
              borderRadius: 999,
              padding: "4px 14px",
              fontSize: 11,
              color: TEAL,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Founding price
          </span>

          {/* Price display */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                color: QUIET,
                textDecoration: "line-through",
                lineHeight: 1.2,
              }}
            >
              $29.99/mo
            </div>
            <div
              style={{
                marginTop: 4,
                display: "inline-flex",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: INK,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                $14.99
              </span>
              <span
                style={{
                  fontSize: 20,
                  color: QUIET,
                  fontWeight: 400,
                  marginLeft: 6,
                }}
              >
                /mo
              </span>
            </div>
            <p
              style={{
                marginTop: 8,
                fontSize: 13,
                color: TEAL,
                fontWeight: 500,
              }}
            >
              Locked in forever when you sign up today
            </p>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #F0F0EE", margin: "16px 0" }} />

          {/* What's included */}
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#888",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            What's included
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {features.map((f) => (
              <li
                key={f}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span style={{ color: TEAL, fontWeight: 700, lineHeight: "1.4" }}>✓</span>
                <span style={{ fontSize: 14, color: INK, lineHeight: 1.4 }}>{f}</span>
              </li>
            ))}
          </ul>

          <hr style={{ border: 0, borderTop: "1px solid #F0F0EE", margin: "16px 0" }} />

          {/* Add-ons */}
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#888",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Add-ons
          </div>
          <div>
            {addons.map((a, i) => (
              <div
                key={a.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  padding: "8px 0",
                  borderBottom: i < addons.length - 1 ? "1px solid #F5F5F3" : "1px solid #F5F5F3",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>
                    {a.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#888",
                      marginTop: 2,
                      lineHeight: 1.5,
                    }}
                  >
                    {a.desc}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: INK,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.price}
                </div>
              </div>
            ))}
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #F0F0EE", margin: "16px 0" }} />

          {/* CTA button */}
          <a
            href="#cta"
            onClick={smoothScrollTo("#cta")}
            className="dim-btn-teal"
            style={{
              display: "block",
              width: "100%",
              background: TEAL,
              color: "white",
              fontSize: 15,
              fontWeight: 600,
              padding: "14px",
              borderRadius: 8,
              textAlign: "center",
              textDecoration: "none",
              border: "none",
              boxSizing: "border-box",
            }}
          >
            Claim your founding spot
          </a>
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: QUIET,
              textAlign: "center",
            }}
          >
            No payment until your site is live and approved.
          </p>
        </div>

        {/* Annual callout */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              background: OFFWHITE,
              borderRadius: 8,
              padding: "14px 20px",
              fontSize: 14,
              color: MUTED_DARK,
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            Pay annually and get 2 months free - that's just{" "}
            <strong style={{ color: TEAL, fontWeight: 700 }}>$12.49/mo</strong>{" "}
            on the founding price
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Lead form (used in the hero, above the fold) ────────────────────────

const PLACEHOLDER_PREFIX = "I run a ";

const PLACEHOLDER_ENDINGS = [
  "plumbing business and my website is years out of date...",
  "small café and we never update our site anymore...",
  "cleaning service and my Google listing has wrong hours...",
  "painting business - we do great work but nobody knows it...",
  "locksmith business and my site looks nothing like us...",
  "handyman business and customers can't find my info...",
  "personal training studio and my site hasn't changed in years...",
  "small restaurant and we post updates nowhere but Instagram...",
];

const NON_US_COUNTRY_CODES = [
  "+44", "+353", "+61", "+64", "+91",
  "+33", "+49", "+34", "+39", "+86",
  "+81", "+82", "+52", "+55", "+27",
  "+31", "+32", "+41", "+43", "+45",
  "+46", "+47", "+48", "+90", "+972",
];

// Strip everything but digits and a leading +.
function cleanPhone(raw: string): string {
  const trimmed = raw.trim();
  const startsPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");
  return startsPlus ? `+${digits}` : digits;
}

type PhoneCheck =
  | { ok: true; cleaned: string }
  | { ok: false; reason: "non-us" | "format" };

function validateUSPhone(raw: string): PhoneCheck {
  const trimmed = raw.trim();
  for (const cc of NON_US_COUNTRY_CODES) {
    if (trimmed.startsWith(cc)) return { ok: false, reason: "non-us" };
  }
  const cleaned = cleanPhone(trimmed);
  // Accept 10 digits, or +1 followed by 10 digits.
  if (/^\d{10}$/.test(cleaned)) return { ok: true, cleaned };
  if (/^\+1\d{10}$/.test(cleaned)) return { ok: true, cleaned };
  // Allow the user to enter +1 and then digits that make 11 (length-1 + leading 1)
  if (/^1\d{10}$/.test(cleaned)) return { ok: true, cleaned: `+${cleaned}` };
  return { ok: false, reason: "format" };
}

type LeadFormTheme = "light" | "dark";

function LeadForm({ theme }: { theme: LeadFormTheme }) {
  const isDark = theme === "dark";

  // Theme-dependent copy colours so the same form reads cleanly on either bg.
  const errSubtle = isDark ? "rgba(255,255,255,0.5)" : MUTED;
  const reassurance = isDark ? "rgba(255,255,255,0.35)" : QUIET;
  const fallbackLink = isDark ? "rgba(255,255,255,0.7)" : MUTED_DARK;
  const fallbackLabel = isDark ? "rgba(255,255,255,0.4)" : QUIET;
  const shadow = isDark
    ? "0 4px 24px rgba(0,0,0,0.3)"
    : "0 8px 32px rgba(31,33,36,0.10), 0 1px 3px rgba(31,33,36,0.06)";

  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phoneErr, setPhoneErr] = useState<string | null>(null);

  // Rotating placeholder for the textarea.
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

  useEffect(() => {
    if (message.length > 0 || textareaFocused) return;
    const cycle = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_ENDINGS.length);
        setPlaceholderVisible(true);
      }, 320);
    }, 3000);
    return () => clearInterval(cycle);
  }, [message, textareaFocused]);

  // Live phone-number sanity feedback for non-US country codes.
  useEffect(() => {
    if (!phone) {
      setPhoneErr(null);
      return;
    }
    for (const cc of NON_US_COUNTRY_CODES) {
      if (phone.trim().startsWith(cc)) {
        setPhoneErr("Sorry - we're only available in the US right now");
        return;
      }
    }
    setPhoneErr(null);
  }, [phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!message.trim()) {
      setErr("Tell us a bit about your business first.");
      return;
    }
    const check = validateUSPhone(phone);
    if (!check.ok) {
      if (check.reason === "non-us") {
        setPhoneErr("Sorry - we're only available in the US right now");
      } else {
        setPhoneErr("That doesn't look like a US phone number.");
      }
      return;
    }
    setPhoneErr(null);

    setSubmitting(true);
    try {
      const r = await fetch("/api/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          phone: check.cleaned,
          source: "homepage_cta",
        }),
      });
      if (r.ok) {
        setDone(true);
      } else {
        setErr("Something went wrong - text us directly at (000) 000-0000");
      }
    } catch {
      setErr("Something went wrong - text us directly at (000) 000-0000");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <LeadFormSuccess theme={theme} />;
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <form onSubmit={onSubmit}>
        <div
          style={{
            background: "white",
            borderRadius: 14,
            padding: 4,
            boxShadow: shadow,
            position: "relative",
            textAlign: "left",
            border: isDark ? "none" : `1px solid ${HAIRLINE}`,
          }}
        >
          {/* Textarea + animated placeholder. The prefix "I run a " is
              static; only the ending fades and rotates, Lovable-style. */}
          <div style={{ position: "relative" }}>
            {message.length === 0 && !textareaFocused && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 18,
                  left: 20,
                  right: 20,
                  fontSize: 16,
                  color: "#999",
                  lineHeight: 1.6,
                  pointerEvents: "none",
                }}
              >
                <span>{PLACEHOLDER_PREFIX}</span>
                <span
                  style={{
                    opacity: placeholderVisible ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  {PLACEHOLDER_ENDINGS[placeholderIdx]}
                </span>
              </div>
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setTextareaFocused(true)}
              onBlur={() => setTextareaFocused(false)}
              className="dim-cta-textarea"
              style={{
                width: "100%",
                minHeight: 110,
                resize: "none",
                background: "transparent",
                border: "none",
                outline: "none",
                padding: "18px 20px",
                fontSize: 16,
                color: INK,
                lineHeight: 1.6,
                fontFamily: "inherit",
                display: "block",
              }}
            />
          </div>

          {/* Bottom bar */}
          <div
            className="dim-cta-bottom"
            style={{
              borderTop: "1px solid #F0F0EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              gap: 12,
            }}
          >
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              className="dim-cta-phone-input"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 15,
                color: INK,
                width: 200,
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="dim-btn-teal dim-cta-send"
              style={{
                background: TEAL,
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                cursor: submitting ? "default" : "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Sending..." : "Let's get started"}
            </button>
          </div>
        </div>

        {phoneErr && (
          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#E05555",
              textAlign: "left",
            }}
          >
            {phoneErr}
          </p>
        )}

        {err && (
          <p style={{ marginTop: 12, fontSize: 13, color: errSubtle }}>{err}</p>
        )}

        {/* Below input: founding spot indicator + reassurance */}
        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            color: TEAL,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          <span
            className="dim-pulse"
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: TEAL,
              marginRight: 8,
              verticalAlign: "middle",
            }}
          />
          <CountUp target={SPOTS_REMAINING} durationMs={1100} /> founding spots remaining
        </p>
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: theme === "dark" ? "rgba(255,255,255,0.4)" : QUIET,
            textAlign: "center",
          }}
        >
          No payment details needed. We build first, you decide.
        </p>
      </form>

      {/* Phone fallback */}
      <p
        style={{
          marginTop: 8,
          fontSize: 13,
          color: theme === "dark" ? "rgba(255,255,255,0.4)" : MUTED_DARK,
          textAlign: "center",
        }}
      >
        or text/call{" "}
        <a
          href="tel:+10000000000"
          style={{ color: theme === "dark" ? "rgba(255,255,255,0.7)" : MUTED_DARK, textDecoration: "none" }}
        >
          (000) 000-0000
        </a>
      </p>
    </div>
  );
}

function LeadFormSuccess({ theme }: { theme: LeadFormTheme }) {
  const isDark = theme === "dark";
  return (
    <div
      style={{
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: isDark ? "transparent" : "white",
        border: isDark ? "none" : `1px solid ${HAIRLINE}`,
        borderRadius: 14,
        padding: isDark ? 0 : "32px 24px",
        boxShadow: isDark
          ? "none"
          : "0 8px 32px rgba(31,33,36,0.10), 0 1px 3px rgba(31,33,36,0.06)",
        maxWidth: 640,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: TEAL,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
        }}
      >
        ✓
      </div>
      <h3
        style={{
          marginTop: 16,
          fontSize: 28,
          fontWeight: 700,
          color: isDark ? "white" : INK,
        }}
      >
        You're in.
      </h3>
      <p
        style={{
          marginTop: 8,
          fontSize: 16,
          color: isDark ? "rgba(255,255,255,0.65)" : MUTED,
          lineHeight: 1.6,
          textAlign: "center",
        }}
      >
        We'll be in touch today.
      </p>
    </div>
  );
}

// ─── FinalCta - last-ditch closer above the dark form ─────────────────────
function FinalCta() {
  return (
    <section
      style={{
        background: "white",
        padding: "72px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
          Still reading? Your competitors aren't.
        </h2>
        <p
          style={{
            fontSize: 16,
            color: MUTED,
            lineHeight: 1.7,
            maxWidth: 480,
            margin: "16px auto 0",
          }}
        >
          Every day your site sits stale, someone searches for what you do
          and picks someone else. It takes one conversation to fix that.
        </p>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <a
            href="#cta"
            onClick={smoothScrollTo("#cta")}
            className="dim-btn-teal"
            style={{
              background: TEAL,
              color: "white",
              fontSize: 15,
              fontWeight: 600,
              padding: "14px 28px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Let's get started
          </a>
          <a
            href="sms:+10000000000?body=Hi, I have a question about Dimmlo"
            className="dim-btn-outline"
            style={{
              background: "transparent",
              border: `1px solid ${INK}`,
              color: INK,
              fontSize: 15,
              fontWeight: 500,
              padding: "14px 28px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Text us a question
          </a>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: QUIET }}>
          No commitment. No credit card. Just a conversation.
        </p>
      </div>
    </section>
  );
}

// ─── Cta - dark section housing the lead form (id="cta") ─────────────────
function Cta() {
  return (
    <section
      id="cta"
      className="dim-section-rel"
      style={{ background: INK, padding: "96px 24px", color: "white" }}
    >
      <SectionGlow x="50%" y="50%" size={720} intensity={0.18} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          className="dim-cta-h"
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Get your site built. Start today.
        </h2>
        <p
          style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.65)",
            marginTop: 16,
            lineHeight: 1.6,
          }}
        >
          Tell us about your business. We build your site for free and send
          you a preview. You pay only when you're happy with it. Updates
          forever - just text us.
        </p>

        <div
          style={{
            marginTop: 28,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
          }}
        >
          Text or call to get started - your choice
        </div>

        <div style={{ marginTop: 28 }}>
          <LeadForm theme="dark" />
        </div>
      </div>
    </section>
  );
}

// ─── Section 10 - Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: "white",
        borderTop: `1px solid ${HAIRLINE}`,
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dark.svg" alt="Dimmlo" style={{ height: 20, display: "block" }} />
        <span style={{ fontSize: 13, color: QUIET }}>© 2026 Dimmlo</span>
      </div>
    </footer>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function smoothScrollTo(selector: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = document.querySelector(selector);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
}
