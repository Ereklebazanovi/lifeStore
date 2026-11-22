import type { VercelRequest, VercelResponse } from "@vercel/node";

export function redirectToSpa(req: VercelRequest, res: VercelResponse, path: string, language: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "lang" || key === "id" || key === "slug" || key === "_spa" || !value) continue;
    for (const entry of Array.isArray(value) ? value : [value]) params.append(key, entry);
  }
  params.set("_spa", "1");
  const prefix = language === "en" || language === "ru" ? `/${language}` : "";
  res.redirect(302, `${prefix}${path}?${params.toString()}`);
}
