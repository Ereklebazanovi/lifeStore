import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export default function PolicyLinks() {
  const { t } = useTranslation();
  return (
    <nav className="store-policy-links" aria-label={t("footer.support")}>
      <NavLink end to="/terms">{t("footer.terms")}</NavLink>
      <NavLink end to="/refund-policy">{t("footer.refundPolicy")}</NavLink>
      <NavLink end to="/privacy-policy">{t("footer.privacy")}</NavLink>
    </nav>
  );
}
