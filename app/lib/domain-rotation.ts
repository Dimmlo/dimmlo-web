import { prisma } from "./prisma";
import type { SendingDomain } from "@prisma/client";

// Round-robin domain picker. Returns the non-paused domain with the lowest
// sendsToday whose sendsToday is still under its dailyLimit. Excludes any
// domain ID already used in the current cron invocation so each domain
// sends at most one email per run.
export async function getNextDomain(
  excludeIds: string[] = []
): Promise<SendingDomain | null> {
  const domains = await prisma.sendingDomain.findMany({
    where: {
      isPaused: false,
      id: { notIn: excludeIds.length > 0 ? excludeIds : ["__none__"] },
    },
    orderBy: { sendsToday: "asc" },
  });

  for (const d of domains) {
    if (d.sendsToday < d.dailyLimit) return d;
  }
  return null;
}
