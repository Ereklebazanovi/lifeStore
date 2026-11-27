import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function BlackFridayHero({ startingPrice, href }: { startingPrice: number | null; href?: string }) {
  const { t, i18n } = useTranslation();
  const price = startingPrice === null
    ? null
    : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(startingPrice);

  return (
    <section className={`black-friday-hero${href ? "" : " black-friday-hero-compact"}`} aria-labelledby="black-friday-title">
      <div className="black-friday-hero-copy">
        <h1 id="black-friday-title" className="store-display">{t("blackFriday.title")}</h1>
        {price !== null && <p>{t("blackFriday.priceFrom", { price })}</p>}
        {href && (
          <Link to={href} className="store-button">
            {t("blackFriday.cta")}<ArrowRight size={18} aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="black-friday-hero-photo">
        <img src="/black-friday-hero.webp" alt="" width={1536} height={1024} fetchPriority="high" />
      </div>
    </section>
  );
}
