import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE_URL = "https://lifestore.ge";

const BOT_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|Slurp|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot/i;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const ua = (req.headers["user-agent"] as string) || "";
  if (!BOT_PATTERN.test(ua)) {
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.redirect(302, `/about?_spa=1`);
    return;
  }

  const pageUrl = `${SITE_URL}/about`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Life Store",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
    },
    description:
      "Life Store - ეკომეგობრული ჭურჭლისა და საყოფაცხოვრებო ნივთების ონლაინ მაღაზია საქართველოში. ჩვენ გთავაზობთ BPA-Free უჟანგავი ფოლადისა და ბამბუკის პროდუქტებს.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: { "@type": "Language", name: "Georgian" },
    },
    sameAs: [],
    foundingLocation: {
      "@type": "Place",
      name: "საქართველო",
      address: {
        "@type": "PostalAddress",
        addressCountry: "GE",
      },
    },
  };

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "ჩვენ შესახებ | Life Store",
    description:
      "გაიცანით Life Store - ეკომეგობრული ცხოვრების სტილი თქვენი ყოველდღიურობისთვის. ვთავაზობთ BPA-Free, SUS 304 უჟანგავი ფოლადისა და ბამბუკის პროდუქტებს.",
    url: pageUrl,
    inLanguage: "ka",
    mainEntity: {
      "@type": "Organization",
      name: "Life Store",
      url: SITE_URL,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "მთავარი", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "ჩვენ შესახებ", item: pageUrl },
    ],
  };

  const title = "ჩვენ შესახებ | Life Store - ეკომეგობრული ნივთები საქართველოში";
  const description =
    "გაიცანით Life Store - ეკომეგობრული ჭურჭლის და საყოფაცხოვრებო ნივთების მაღაზია. BPA-Free SUS 304 ფოლადი, ბამბუკი. ჯანსაღი გარემო იწყება სახლიდან.";
  const imageUrl = `${SITE_URL}/logo.png`;

  const html = `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="ეკომეგობრული, BPA-Free, ბამბუკი, უჟანგავი ფოლადი, ლანჩბოქსი, ეკოლანჩბოქსი, ეკო ნივთები, Life Store">
  <link rel="canonical" href="${pageUrl}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="ka_GE">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">

  <script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(aboutPageSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">Life Store</a> /
    <span>ჩვენ შესახებ</span>
  </nav>
  <main>
    <h1>გაიცანით Life Store - ეკომეგობრული ცხოვრების სტილი თქვენი ყოველდღიურობისთვის</h1>

    <p>
      დღევანდელ სწრაფად განვითარებად სამყაროში, სადაც პლასტმასის მოხმარებამ
      კრიტიკულ ზღვარს მიაღწია, ჯანმრთელობაზე და გარემოზე ზრუნვა თითოეული
      ჩვენგანის პასუხისმგებლობაა. Life Store შეიქმნა ზუსტად იმისთვის, რომ
      შემოგთავაზოთ პლასტმასის ჭურჭლისა და საყოფაცხოვრებო ნივთების უსაფრთხო,
      გრძელვადიანი და ესთეტიკური ალტერნატივები. ჩვენი მიზანია, ეკომეგობრული
      ცხოვრების წესი ყველასთვის ხელმისაწვდომი და კომფორტული გავხადოთ.
    </p>

    <h2>ჩვენი მისია: უსაფრთხო ალტერნატივა ყოველდღიურობისთვის</h2>
    <p>
      ჩვენი მიზანი მარტივია - დაგეხმაროთ პლასტმასის მოხმარების შემცირებაში
      ისე, რომ არ მოგიწიოთ კომფორტზე უარის თქმა. Life Store-ში წარმოდგენილი
      თითოეული ნივთი შერჩეულია იმისთვის, რომ თქვენი კვების რუტინა გახდეს
      უფრო ჯანსაღი, ხოლო სახლის გარემო - ბევრად უსაფრთხო.
    </p>

    <h2>რატომ უნდა ენდოთ Life Store-ის ხარისხს?</h2>

    <h3>პრემიუმ მასალები</h3>
    <p>
      ჩვენი ლანჩბოქსები და კონტეინერები დამზადებულია უმაღლესი სტანდარტის
      SUS 304 უჟანგავი ფოლადისა და ნაწრთობი მინისგან, რომლებიც არ შეიცავენ
      მავნე BPA-ს.
    </p>

    <h3>ბუნებრივი ესთეტიკა</h3>
    <p>
      სათავსოები და აქსესუარები დამზადებულია 100%-ით ნატურალური, განახლებადი
      ბამბუკისგან, რომელიც სააბაზანოსა თუ სამზარეულოს გამორჩეულ სიმყუდროვეს სძენს.
    </p>

    <h3>ერგონომიულობა და სტილი</h3>
    <p>
      ყოველი ნივთი შერჩეულია ისე, რომ იყოს მაქსიმალურად პრაქტიკული ოფისში,
      სკოლაში თუ მოგზაურობისას სატარებლად.
    </p>

    <h2>მდგრადი მომავალი იწყება დღეს</h2>
    <p>
      ჩვენ გვჯერა, რომ დიდი ცვლილებები პატარა, ყოველდღიური არჩევანით იწყება.
      Life Store თქვენი საიმედო პარტნიორია ამ გზაზე. შემოუერთდით ჩვენს
      ეკომეგობრულ ოჯახს და შეცვალეთ თქვენი ყოველდღიურობა უკეთესობისკენ.
    </p>

    <a href="${SITE_URL}/products">ყველა პროდუქტი</a>
  </main>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache");
  res.status(200).send(html);
}

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
