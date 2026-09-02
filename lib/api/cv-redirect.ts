import type { Route } from "next";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { cvUrls, getAboutData } from "@/lib/data/about";
import { db } from "@/lib/db/client";
import { profileLink } from "@/lib/db/app-schema";

/**
 * Redirect to one of the CV links stored on the profile.
 *
 * Ports `_CVLinkRedirectView`. The three paths (/cv/, /cv-latest/, /cv-copy/)
 * are stable public URLs that point at documents hosted elsewhere, so the
 * destination can change in the admin without the shared link breaking.
 *
 * An unset link falls back to the homepage rather than 404ing: a stale CV link
 * in someone's inbox should land somewhere useful.
 */
export async function cvRedirect(key: "main" | "latest" | "copy"): Promise<never> {
  const about = await getAboutData();
  let url = about?.cv?.[key];

  if (!url) {
    try {
      const rows = await db
        .select({ platform: profileLink.platform, url: profileLink.url })
        .from(profileLink)
        .where(eq(profileLink.kind, "cv"))
        .orderBy(asc(profileLink.position));

      const direct = cvUrls(rows);
      url = direct[key];
    } catch {
      // Fall through to "/" fallback on db error
    }
  }

  // The destination is an absolute URL stored in the database (Google Drive,
  // typically), which `typedRoutes` cannot know about -- its `Route` type only
  // covers this app's own paths. The cast is the narrow escape hatch for that;
  // `redirect()` handles absolute URLs correctly at runtime.
  redirect((url || "/") as Route);
}

