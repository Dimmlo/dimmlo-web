const tiers = [
  {
    name: "Starter",
    price: "$29",
    cadence: "/mo",
    description: "Website published and kept current. Text to update.",
    bullets: [
      "Custom website built and live in 48 hours",
      "Unlimited updates by text",
      "Google Business listing kept current",
    ],
  },
  {
    name: "Growth",
    price: "$59",
    cadence: "/mo",
    description: "Everything in Starter, plus 3-4 social posts per week in your voice.",
    bullets: [
      "Everything in Starter",
      "3-4 social posts/week, written in your voice",
      "Cross-posted to Facebook, Instagram, Google",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    price: "$99",
    cadence: "/mo",
    description: "Everything in Growth, plus AI handles customer enquiries 24/7.",
    bullets: [
      "Everything in Growth",
      "AI receptionist handles enquiries 24/7",
      "Books calls, answers FAQs, captures leads",
    ],
  },
];

export default function PricingSection() {
  return (
    <section className="bg-off-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-ink sm:text-4xl">
            Simple pricing. No surprises.
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Pay annually, get 2 months free.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-2xl bg-white p-8 ${
                t.highlight
                  ? "border-2 border-teal shadow-md"
                  : "border border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold text-ink">{t.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-semibold text-ink">{t.price}</span>
                <span className="ml-1 text-base text-gray-600">{t.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{t.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-gray-700">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start">
                    <span className="mr-2 text-teal">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#cta"
                className={`mt-8 block w-full rounded-md px-4 py-3 text-center text-sm font-medium ${
                  t.highlight
                    ? "bg-teal text-white hover:bg-teal-dark"
                    : "border border-gray-300 text-ink hover:bg-gray-50"
                }`}
              >
                Get started
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
