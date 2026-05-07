"use client";

import { useEffect, useState } from "react";
import type { Contact } from "@prisma/client";

export default function ContactSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    fetch(`/api/admin/contacts?${params}`)
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts ?? []))
      .catch(() => setContacts([]));
  }, [q]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div>
      <input
        className="input"
        placeholder="Search contacts..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-gray-200">
        {contacts.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No contacts found.</div>
        ) : (
          contacts.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2 border-b border-gray-100 p-2 last:border-b-0 hover:bg-off-white"
            >
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-ink">
                  {c.businessName}
                </div>
                <div className="text-xs text-gray-500">
                  {c.category} · {c.borough ?? "—"} · {c.email ?? c.phone ?? "no contact"}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
