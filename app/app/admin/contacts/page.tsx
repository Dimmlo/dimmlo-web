"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Contact } from "@prisma/client";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    try {
      const r = await fetch(`/api/admin/contacts?${params}`);
      const d = await r.json();
      setContacts(d.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Contacts</h1>
          <p className="text-sm text-gray-500">Everyone in the database.</p>
        </div>
        <Link href="/admin/contacts/import" className="btn-primary text-sm py-2 px-4">
          Import CSV
        </Link>
      </div>

      <input
        className="input max-w-md"
        placeholder="Search by business name, email, phone..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-off-white text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Borough</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No contacts. Import a CSV to add some.
                </td>
              </tr>
            )}
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-ink">{c.businessName}</td>
                <td className="px-4 py-2 text-gray-700">{c.category}</td>
                <td className="px-4 py-2 text-gray-700">{c.borough ?? "—"}</td>
                <td className="px-4 py-2 text-gray-700">{c.email ?? "—"}</td>
                <td className="px-4 py-2 text-gray-700">{c.phone ?? "—"}</td>
                <td className="px-4 py-2">
                  <span className="badge-grey">{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
