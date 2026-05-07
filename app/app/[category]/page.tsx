import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoryPageView from "@/components/public/CategoryPage";

export const dynamic = "force-dynamic";

type Params = { category: string };

export default async function Page({ params }: { params: Params }) {
  // Try to load the landing page by slug from the DB. If the DB is
  // unreachable (e.g. no real DATABASE_URL configured yet), 404 cleanly.
  let lp = null;
  try {
    lp = await prisma.landingPage.findUnique({
      where: { slug: params.category },
    });
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Database not connected</h1>
          <p className="mt-3 text-sm text-gray-600">
            Set <code>DATABASE_URL</code> in <code>.env.local</code> and run
            <br />
            <code>npx prisma db push &amp;&amp; npx prisma db seed</code>.
          </p>
        </div>
      </main>
    );
  }

  if (!lp || !lp.isPublished) notFound();
  return <CategoryPageView landingPage={lp} />;
}
