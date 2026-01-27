import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  canonicalUrl?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Life Store - ჰარმონია დეტალებშია | ეკომეგობრული სახლის ნივთები",
  description = "Life Store - თანამედროვე დიზაინისა და ჯანმრთელობისთვის უვნებელი ეკომეგობრული სახლისა და სამზარეულოს ნივთები. გახადე შენი სახლი კომფორტული და დახვეწილი სივრცე.",
  keywords = "ეკომეგობრული ნივთები, სახლის ნივთები, სამზარეულო, თანამედროვე დიზაინი, ჯანსაღი ცხოვრება, Life Store",
  ogImage = "https://lifestore.ge/Screenshot 2025-12-10 151703.png",
  ogType = "website",
  canonicalUrl,
  structuredData
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:site_name', 'Life Store', true);
    if (canonicalUrl) {
      updateMetaTag('og:url', canonicalUrl, true);
    }

    // Facebook specific tags - Remove fake app ID to avoid conflicts
    // updateMetaTag('fb:app_id', '1234567890', true); // Commented out - use real app ID when available

    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', ogImage, true);

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    }

    // Structured Data
    if (structuredData) {
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

  }, [title, description, keywords, ogImage, ogType, canonicalUrl, structuredData]);

  return null;
};

export default SEOHead;