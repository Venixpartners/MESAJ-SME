import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Search engines are welcome on the public pages and nowhere else. The
 * signed in areas hold client data and would be useless in a search
 * result anyway, and the API is not a page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api/", "/onboarding", "/auth/", "/reset-password", "/forgot-password"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
