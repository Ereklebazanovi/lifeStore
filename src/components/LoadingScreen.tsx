import { useTranslation } from "react-i18next";

export default function LoadingScreen({ inline = false }: { inline?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className={`store-loader store-loader--${inline ? "inline" : "screen"}`} role="status">
      <span className="store-loader-message">{t("common.loading")}</span>
      <div className="store-loader-content" aria-hidden="true">
        {!inline && (
          <div className="store-loader-brand">
            <span className="store-loader-mark"><img src="/logo.webp" alt="" width={843} height={637} /></span>
            <span lang="en">Life Store</span>
          </div>
        )}
        <div className="store-loader-track" />
      </div>
    </div>
  );
}
