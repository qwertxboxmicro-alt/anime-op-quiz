// Switch the default to https://kikoe.io once the domain is live. Do not hardcode kikoe.io here.
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://anime-op-quiz-alpha.vercel.app").replace(/\/$/, "");
