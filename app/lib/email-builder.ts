import type { Contact } from "@prisma/client";
import { personaliseOpener } from "./claude";

// Build the final HTML for an email, with all tracking injected.
// - rewrites href links through /api/email/track/click
// - injects an open pixel referencing /api/email/track/open
// - replaces {{PERSONALISED_OPENER}} with a Claude-generated opener
// - appends a plain-text unsubscribe footer
export type BuildArgs = {
  bodyHtml: string;
  contact: Contact;
  emailSendId: string;
  campaignContactId: string | null;
  baseUrl: string;
};

const PLACEHOLDER_RE = /{{PERSONALISED_OPENER}}/g;

function rewriteLinks(
  html: string,
  emailSendId: string,
  campaignContactId: string | null,
  baseUrl: string
): string {
  // Replace href="..." with the tracking redirect, preserving original attrs
  // around the href. We keep this regex deliberately narrow — it only matches
  // double-quoted hrefs that look like absolute http(s) URLs.
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (_match, url) => {
    const params = new URLSearchParams({
      es: emailSendId,
      cc: campaignContactId ?? "",
      url,
    });
    return `href="${baseUrl}/api/email/track/click?${params.toString()}"`;
  });
}

function openPixel(
  emailSendId: string,
  campaignContactId: string | null,
  baseUrl: string
): string {
  const params = new URLSearchParams({
    es: emailSendId,
    cc: campaignContactId ?? "",
  });
  return `<img src="${baseUrl}/api/email/track/open?${params.toString()}" width="1" height="1" alt="" style="display:none;border:0;" />`;
}

function unsubFooter(contact: Contact, baseUrl: string): string {
  const email = contact.email ?? "";
  const params = new URLSearchParams({ email });
  const url = `${baseUrl}/api/email/unsubscribe?${params.toString()}`;
  return `<p style="margin-top:24px;font-size:12px;color:#888;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Don't want these emails? <a href="${url}" style="color:#888;">Unsubscribe</a>.</p>`;
}

export async function buildEmailHtml(args: BuildArgs): Promise<string> {
  const { bodyHtml, contact, emailSendId, campaignContactId, baseUrl } = args;

  // Personalise the opener via Claude. If Claude is unavailable (e.g. no key),
  // fall back to a generic opener so the email still goes out.
  let opener = "";
  try {
    opener = await personaliseOpener(contact);
  } catch {
    opener = `Saw your ${contact.category.toLowerCase()} listing in ${contact.borough ?? "your area"} — wanted to drop a quick note.`;
  }

  let html = bodyHtml.replace(PLACEHOLDER_RE, opener);
  html = rewriteLinks(html, emailSendId, campaignContactId, baseUrl);

  const wrapped = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1F2124;line-height:1.5;max-width:600px;margin:0 auto;padding:24px;">
${html}
${unsubFooter(contact, baseUrl)}
${openPixel(emailSendId, campaignContactId, baseUrl)}
</body></html>`;

  return wrapped;
}

// Strip HTML for a plain-text fallback. Naive but adequate for short copy.
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
