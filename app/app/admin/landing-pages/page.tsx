"use client";

import { useEffect, useState } from "react";
import type { LandingPage } from "@prisma/client";

export default function LandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<LandingPage | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/landing-pages");
      const d = await r.json();
      setPages(d.landingPages ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function togglePublished(p: LandingPage) {
    await fetch("/api/admin/landing-pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, isPublished: !p.isPublished }),
    });
    await load();
  }

  async function save(p: LandingPage) {
    await fetch("/api/admin/landing-pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: p.id,
        category: p.category,
        slug: p.slug,
        heroHeadline: p.heroHeadline,
        subheadline: p.subheadline,
        painPoints: p.painPoints,
        ctaText: p.ctaText,
        ctaPhone: p.ctaPhone,
      }),
    });
    setEditing(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Landing pages</h1>
          <p className="text-sm text-gray-500">Category-specific public pages.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2 px-4">
          Add page
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pages.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{p.category}</h3>
                  <p className="text-xs text-gray-500">/{p.slug}</p>
                </div>
                <span className={p.isPublished ? "badge-green" : "badge-grey"}>
                  {p.isPublished ? "published" : "draft"}
                </span>
              </div>
              <p className="mt-3 text-sm text-ink">{p.heroHeadline}</p>
              <p className="mt-2 text-xs text-gray-500">
                {p.conversionCount} conversions · {p.painPoints.length} pain points
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-teal hover:underline"
                >
                  Preview
                </a>
                <button onClick={() => setEditing(p)} className="text-xs text-teal hover:underline">
                  Edit
                </button>
                <button onClick={() => togglePublished(p)} className="text-xs text-gray-600 hover:underline">
                  {p.isPublished ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal page={editing} onClose={() => setEditing(null)} onSave={save} />
      )}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onCreated={async () => {
            setShowAdd(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  page,
  onClose,
  onSave,
}: {
  page: LandingPage;
  onClose: () => void;
  onSave: (p: LandingPage) => void;
}) {
  const [p, setP] = useState(page);
  const [painText, setPainText] = useState(page.painPoints.join("\n"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl max-h-[90vh]">
        <h2 className="text-lg font-semibold text-ink">Edit landing page</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs uppercase text-gray-500">Category</label>
            <input className="input mt-1" value={p.category} onChange={(e) => setP({ ...p, category: e.target.value })} />
          </div>
          <div>
            <label className="text-xs uppercase text-gray-500">Slug</label>
            <input className="input mt-1" value={p.slug} onChange={(e) => setP({ ...p, slug: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase text-gray-500">Hero headline</label>
            <input className="input mt-1" value={p.heroHeadline} onChange={(e) => setP({ ...p, heroHeadline: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase text-gray-500">Subheadline</label>
            <textarea className="input mt-1" value={p.subheadline} onChange={(e) => setP({ ...p, subheadline: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase text-gray-500">Pain points (one per line)</label>
            <textarea
              className="input mt-1 min-h-[120px]"
              value={painText}
              onChange={(e) => setPainText(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-gray-500">CTA text</label>
            <input className="input mt-1" value={p.ctaText} onChange={(e) => setP({ ...p, ctaText: e.target.value })} />
          </div>
          <div>
            <label className="text-xs uppercase text-gray-500">CTA phone</label>
            <input className="input mt-1" value={p.ctaPhone} onChange={(e) => setP({ ...p, ctaPhone: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() =>
              onSave({
                ...p,
                painPoints: painText.split("\n").map((s) => s.trim()).filter(Boolean),
              })
            }
            className="btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AddModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [category, setCategory] = useState("");
  const [slug, setSlug] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [painText, setPainText] = useState("");

  async function create() {
    const r = await fetch("/api/admin/landing-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        slug,
        heroHeadline,
        subheadline,
        painPoints: painText.split("\n").map((s) => s.trim()).filter(Boolean),
      }),
    });
    if (r.ok) onCreated();
    else alert("Failed to create");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink">New landing page</h2>
        <div className="mt-4 space-y-3">
          <input className="input" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input className="input" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <input className="input" placeholder="Hero headline" value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} />
          <textarea className="input" placeholder="Subheadline" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} />
          <textarea
            className="input min-h-[120px]"
            placeholder="Pain points, one per line"
            value={painText}
            onChange={(e) => setPainText(e.target.value)}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={create} className="btn-primary" disabled={!category || !slug || !heroHeadline || !subheadline}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
