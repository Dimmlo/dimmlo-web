// Prisma seed script.
// Run with: npx prisma db seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sendingDomains = [
  { domain: "1dimmlo.com", fromEmail: "eddie@1dimmlo.com" },
  { domain: "2dimmlo.com", fromEmail: "eddie@2dimmlo.com" },
  { domain: "3dimmlo.com", fromEmail: "eddie@3dimmlo.com" },
  { domain: "4dimmlo.com", fromEmail: "eddie@4dimmlo.com" },
  { domain: "5dimmlo.com", fromEmail: "eddie@5dimmlo.com" },
];

const landingPages = [
  {
    category: "Plumber",
    slug: "plumber",
    heroHeadline: "Your plumbing business, online. Updated by text.",
    subheadline:
      "Customers search for you. Make sure they find the right hours, the right number, and proof you're still in business.",
    painPoints: [
      "Your website hasn't changed since 2019",
      "Your Google listing has the wrong hours",
      "You lose jobs to competitors who look more active online",
    ],
    ctaText: "Text us to get your site sorted",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Electrician",
    slug: "electrician",
    heroHeadline: "Your electrical business, online. Updated by text.",
    subheadline:
      "When someone needs an electrician fast, they search online first. Make sure what they find is accurate.",
    painPoints: [
      "Your website says you cover areas you no longer service",
      "Customers can't tell if you're still taking jobs",
      "Your competitors look more established online — even if they aren't",
    ],
    ctaText: "Text us to get started",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Handyman",
    slug: "handyman",
    heroHeadline: "Your handyman business. Online and up to date.",
    subheadline:
      "People Google you before they call you. Give them something worth finding.",
    painPoints: [
      "Your website lists services you stopped offering years ago",
      "No recent photos of your work — so customers go with someone else",
      "Updating your site means logging into something you've forgotten the password to",
    ],
    ctaText: "Text us to get your site sorted",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Cleaning Service",
    slug: "cleaning-service",
    heroHeadline: "Your cleaning business. Found online. Always current.",
    subheadline:
      "Most cleaning businesses get their best clients from Google. Make sure your listing and site are worth finding.",
    painPoints: [
      "Your website doesn't show your current service areas",
      "You've added new services but they're not online anywhere",
      "Competitors with worse work look more professional online",
    ],
    ctaText: "Text us to get started",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Locksmith",
    slug: "locksmith",
    heroHeadline: "Your locksmith business. Online when it matters most.",
    subheadline:
      "Locksmith searches happen in emergencies. Your online presence needs to be accurate and current every single day.",
    painPoints: [
      "Wrong hours on Google means missed emergency calls",
      "Your service area isn't clearly listed anywhere online",
      "You look less trustworthy than chains — even though you're local and better",
    ],
    ctaText: "Text us to get started",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Painter",
    slug: "painter",
    heroHeadline: "Your painting business. Online. Up to date. Booked out.",
    subheadline:
      "Customers want to see recent work before they hire. Show them what you've done lately — without rebuilding your site every quarter.",
    painPoints: [
      "Your portfolio is stuck on photos from three years ago",
      "Your pricing page is wrong — but you've not got round to fixing it",
      "Word of mouth gets you jobs, but online traffic just bounces",
    ],
    ctaText: "Text us to get started",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Cafe",
    slug: "cafe",
    heroHeadline: "Your café, online. Menu, hours, and specials. Always right.",
    subheadline:
      "Customers check Google before they walk in. Wrong hours or an old menu means they go elsewhere.",
    painPoints: [
      "Your menu online doesn't match what's actually on the board",
      "Your Google hours haven't been updated since the pandemic",
      "You change specials weekly but nobody finds out until they walk in",
    ],
    ctaText: "Text us to get started",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Personal Trainer",
    slug: "personal-trainer",
    heroHeadline: "Your training business, online. Booked out. Up to date.",
    subheadline:
      "Clients find you through Instagram and Google. Make sure both tell the same, current story.",
    painPoints: [
      "Your site lists pricing that's two years out of date",
      "New clients can't tell what you actually offer right now",
      "Your testimonials are old — recent wins aren't anywhere online",
    ],
    ctaText: "Text us to get started",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Doctor",
    slug: "doctor",
    heroHeadline: "Your independent practice, online. Always current.",
    subheadline:
      "Patients check your website and Google listing before they book. Outdated info costs you patients — and trust.",
    painPoints: [
      "Your site lists insurance plans you no longer accept",
      "Your hours and address haven't been verified in months",
      "New patients can't tell if you're still accepting them",
    ],
    ctaText: "Text us to get started",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
  {
    category: "Physiotherapist",
    slug: "physiotherapist",
    heroHeadline: "Your physio practice, online. Booked. Up to date.",
    subheadline:
      "Patients are looking for someone they can trust quickly. Your website needs to show that — without you spending evenings updating it.",
    painPoints: [
      "Your services page is missing treatments you actually offer now",
      "Your bio is years out of date",
      "Reviews don't appear anywhere on your site — so they don't help convert",
    ],
    ctaText: "Text us to get started",
    ctaPhone: "+1-000-000-0000",
    isPublished: true,
  },
];

async function main() {
  console.log("Seeding sending domains...");
  for (const d of sendingDomains) {
    await prisma.sendingDomain.upsert({
      where: { domain: d.domain },
      update: {},
      create: {
        domain: d.domain,
        fromEmail: d.fromEmail,
        warmupDay: 1,
        dailyLimit: 5,
      },
    });
  }

  console.log("Seeding landing pages...");
  for (const p of landingPages) {
    await prisma.landingPage.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  console.log("Seeding settings...");
  await prisma.setting.upsert({
    where: { key: "app_version" },
    update: { value: "1.0.0" },
    create: { key: "app_version", value: "1.0.0" },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
