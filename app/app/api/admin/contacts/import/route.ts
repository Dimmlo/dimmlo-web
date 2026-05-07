import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../_guard";

// Naive CSV parser sufficient for well-formed inputs (comma-separated, optional
// double-quoted fields). For complex CSVs the user should clean the file first.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        buf += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        buf += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(buf);
        buf = "";
      } else if (ch === "\n") {
        cur.push(buf);
        rows.push(cur);
        cur = [];
        buf = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        buf += ch;
      }
    }
  }
  if (buf.length > 0 || cur.length > 0) {
    cur.push(buf);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const csv = body?.csv as string | undefined;
  if (!csv) {
    return NextResponse.json({ error: "csv field required" }, { status: 400 });
  }

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idxOf = (name: string) => header.indexOf(name);

  const colBusiness = idxOf("businessname");
  const colCategory = idxOf("category");
  if (colBusiness < 0 || colCategory < 0) {
    return NextResponse.json(
      {
        error:
          "CSV must include at least 'businessName' and 'category' columns. Optional: email, phone, firstName, lastName, borough, websiteUrl.",
      },
      { status: 400 }
    );
  }

  let created = 0;
  let skipped = 0;
  for (const row of rows.slice(1)) {
    const businessName = row[colBusiness]?.trim();
    const category = row[colCategory]?.trim();
    if (!businessName || !category) {
      skipped++;
      continue;
    }
    const phone = idxOf("phone") >= 0 ? row[idxOf("phone")]?.trim() : undefined;
    const email = idxOf("email") >= 0 ? row[idxOf("email")]?.trim() : undefined;

    try {
      await prisma.contact.create({
        data: {
          businessName,
          category,
          borough: idxOf("borough") >= 0 ? row[idxOf("borough")]?.trim() || null : null,
          email: email || null,
          phone: phone || null,
          firstName: idxOf("firstname") >= 0 ? row[idxOf("firstname")]?.trim() || null : null,
          lastName: idxOf("lastname") >= 0 ? row[idxOf("lastname")]?.trim() || null : null,
          websiteUrl:
            idxOf("websiteurl") >= 0 ? row[idxOf("websiteurl")]?.trim() || null : null,
        },
      });
      created++;
    } catch {
      // Likely a unique constraint violation on phone/email — skip.
      skipped++;
    }
  }

  return NextResponse.json({ created, skipped, total: rows.length - 1 });
}
