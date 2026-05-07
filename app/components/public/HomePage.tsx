import Link from "next/link";
import LeadCaptureForm from "./LeadCaptureForm";
import PricingSection from "./PricingSection";

const liveCategories = [
  { slug: "plumber", label: "Plumber" },
  { slug: "electrician", label: "Electrician" },
  { slug: "handyman", label: "Handyman" },
  { slug: "locksmith", label: "Locksmith" },
  { slug: "painter", label: "Painter" },
  { slug: "cleaning-service", label: "Cleaning Service" },
  { slug: "cafe", label: "Café" },
  { slug: "personal-trainer", label: "Personal Trainer" },
  { slug: "doctor", label: "Independent Doctor" },
  { slug: "physiotherapist", label: "Physiotherapist" },
];

const comingSoon = ["Hair Salon", "Pet Groomer", "Tattoo Studio"];

const problems = [
  {
    headline: "Your website is out of date",
    body:
      "Customers find wrong hours, old menus, and outdated services — so they keep scrolling.",
  },
  {
    headline: "Updating it takes hours you don't have",
    body:
      "Logins, CMS tools, calling your web guy — and somehow it's still wrong.",
  },
  {
    headline: "So nothing changes",
    body: "And customers go elsewhere — to someone whose listing looks current.",
  },
];

const steps = [
  {
    n: 1,
    headline: "We build your site",
    body: "One call, one questionnaire, live in 48 hours.",
  },
  {
    n: 2,
    headline: "You text us updates",
    body: '"Closed Sunday." "New prices from Monday." Done.',
  },
  {
    n: 3,
    headline: "Everything stays current",
    body: "Website, Google listing, social. Automatic.",
  },
];

export default function HomePage() {
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
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
            Your business, online. <br className="hidden sm:block" />
            Updated by text.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
            No dashboards. No logins. No agency. Just send us a message and
            your website updates itself.
          </p>
          <div className="mt-10">
            <a href="#cta" className="btn-primary text-lg">
              Text us to get started
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-off-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-ink sm:text-4xl">
              The problem with most small business websites
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {problems.map((p) => (
              <div
                key={p.headline}
                className="rounded-2xl bg-white p-8 shadow-sm"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <span className="text-lg font-semibold">!</span>
                </div>
                <h3 className="text-lg font-semibold text-ink">{p.headline}</h3>
                <p className="mt-2 text-sm text-gray-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-ink sm:text-4xl">
              Here's how Dimmlo works
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center sm:text-left">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
                  {s.n}
                </div>
                <h3 className="text-xl font-semibold text-ink">{s.headline}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-off-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-ink sm:text-4xl">
              Built for businesses like yours
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {liveCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm font-medium text-ink transition-colors hover:border-teal hover:text-teal"
              >
                {c.label}
              </Link>
            ))}
            {comingSoon.map((c) => (
              <div
                key={c}
                className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400"
              >
                {c}
                <br />
                <span className="text-xs">coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section id="cta" className="bg-teal px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Ready to stop worrying about your website?
          </h2>
          <p className="mt-3 text-base text-white/80">
            Send us a message. We'll be in touch within the day.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <LeadCaptureForm
              source="homepage"
              ctaPhone="+1-000-000-0000"
              ctaText="Text us to get started"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-base font-semibold text-ink">Dimmlo</span>
          <span className="text-sm text-gray-500">© 2026 Dimmlo</span>
        </div>
      </footer>
    </main>
  );
}
