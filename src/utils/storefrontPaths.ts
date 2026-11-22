export const getStorefrontLanguage = (language: string) => {
  const base = language.split("-")[0];
  return base === "en" || base === "ru" ? base : "ka";
};

export function storefrontPath(path: string, language: string): string {
  const pathname = path.replace(/^\/(en|ru)(?=\/|$)/, "") || "/";
  const lang = getStorefrontLanguage(language);
  if (lang === "ka" || !/^(?:\/|\/(?:products|category\/[^/]+|product\/[^/]+(?:\/review)?|blog(?:\/[^/]+)?|about))\/?$/.test(pathname)) {
    return pathname;
  }
  return pathname === "/" ? `/${lang}` : `/${lang}${pathname}`;
}
