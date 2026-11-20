import type { MetadataRoute } from "next";
import { SITE } from "@/platform/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/op-quiz", "/privacy", "/terms"].map((path) => ({ url: `${SITE}${path}` }));
}
