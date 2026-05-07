"use client";

import { useState } from "react";

type Props = {
  source: string;
  ctaPhone?: string;
  ctaText?: string;
};

// Lead capture form: on mobile shows a tap-to-text button, on desktop shows
// a name + phone form. Submits to /api/inbound.
export default function LeadCaptureForm({ source, ctaPhone, ctaText }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const resp = await fetch("/api/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          businessName,
          message,
          source,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErr(data.error ?? "Something went wrong. Try the phone link instead.");
      } else {
        setDone(data.message ?? "We'll be in touch shortly.");
      }
    } catch {
      setErr("Couldn't send. Try the phone link instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg bg-white p-6 text-ink shadow-sm">
        <p className="text-lg font-medium">{done}</p>
      </div>
    );
  }

  const phoneHref = ctaPhone ? `sms:${ctaPhone.replace(/[^0-9+]/g, "")}` : "sms:";

  return (
    <div className="space-y-4">
      {/* Mobile: prominent tap-to-text button */}
      <a
        href={phoneHref}
        className="btn-primary w-full text-lg sm:hidden"
      >
        {ctaText ?? "Text us to get started"}
      </a>

      {/* Desktop: name + phone + optional business name */}
      <form onSubmit={onSubmit} className="hidden space-y-3 sm:block">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <input
          className="input"
          placeholder="Business name (optional)"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        <textarea
          className="input min-h-[80px]"
          placeholder="What's the situation? (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Sending..." : ctaText ?? "Get started"}
        </button>
        {err && <p className="text-sm text-red-700">{err}</p>}
      </form>
    </div>
  );
}
