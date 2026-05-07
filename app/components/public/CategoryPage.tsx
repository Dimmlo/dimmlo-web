import Link from "next/link";
import LeadCaptureForm from "./LeadCaptureForm";
import type { LandingPage } from "@prisma/client";

type Props = {
  landingPage: LandingPage;
};

export default function CategoryPage({ landingPage }: Props) {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold tracking-tight text-ink">
            Dimmlo
          </Link>
          <a href="#cta" className="btn-primary text-sm py-2 px-4">
            Get started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="badge-grey">For {landingPage.category}s</span>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            {landingPage.heroHeadline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
            {landingPage.subheadline}
          </p>
          <div className="mt-10">
            <a href="#cta" className="btn-primary text-lg">
              {landingPage.ctaText}
            </a>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-off-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-ink sm:text-4xl">
              Sound familiar?
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {landingPage.painPoints.map((p, i) => (
              <div key={i} className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <span className="text-lg font-semibold">{i + 1}</span>
                </div>
                <p className="text-base text-ink">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="bg-teal px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            {landingPage.ctaText}
          </h2>
          <p className="mt-3 text-base text-white/80">
            We'll come back with a quick proposal — no hard sell.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <LeadCaptureForm
              source={landingPage.slug}
              ctaPhone={landingPage.ctaPhone}
              ctaText={landingPage.ctaText}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-base font-semibold text-ink">
            Dimmlo
          </Link>
          <span className="text-sm text-gray-500">© 2026 Dimmlo</span>
        </div>
      </footer>
    </main>
  );
}
