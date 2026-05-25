import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE_URL = "https://lifestore.ge";

const BOT_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|Slurp|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot/i;

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Static content for all three languages
const CONTENT = {
  ka: {
    htmlLang: "ka",
    ogLocale: "ka_GE",
    title: "ჩვენ შესახებ | Life Store - ეკომეგობრული ნივთები საქართველოში",
    description:
      "გაიცანით Life Store - ეკომეგობრული ჭურჭლის და საყოფაცხოვრებო ნივთების მაღაზია. BPA-Free SUS 304 ფოლადი, ბამბუკი. ჯანსაღი გარემო იწყება სახლიდან.",
    keywords: "ეკომეგობრული, BPA-Free, ბამბუკი, უჟანგავი ფოლადი, ლანჩბოქსი, ეკო ნივთები, Life Store",
    schemaName: "ჩვენ შესახებ | Life Store",
    schemaDesc: "გაიცანით Life Store - ეკომეგობრული ცხოვრების სტილი თქვენი ყოველდღიურობისთვის. ვთავაზობთ BPA-Free, SUS 304 უჟანგავი ფოლადისა და ბამბუკის პროდუქტებს.",
    home: "მთავარი",
    aboutUs: "ჩვენ შესახებ",
    h1: "გაიცანით Life Store - ეკომეგობრული ცხოვრების სტილი თქვენი ყოველდღიურობისთვის",
    intro: "დღევანდელ სწრაფად განვითარებად სამყაროში, სადაც პლასტმასის მოხმარებამ კრიტიკულ ზღვარს მიაღწია, ჯანმრთელობაზე და გარემოზე ზრუნვა თითოეული ჩვენგანის პასუხისმგებლობაა. Life Store შეიქმნა ზუსტად იმისთვის, რომ შემოგთავაზოთ პლასტმასის ჭურჭლისა და საყოფაცხოვრებო ნივთების უსაფრთხო, გრძელვადიანი და ესთეტიკური ალტერნატივები. ჩვენი მიზანია, ეკომეგობრული ცხოვრების წესი ყველასთვის ხელმისაწვდომი და კომფორტული გავხადოთ.",
    missionTitle: "ჩვენი მისია: უსაფრთხო ალტერნატივა ყოველდღიურობისთვის",
    missionText: "ჩვენი მიზანი მარტივია - დაგეხმაროთ პლასტმასის მოხმარების შემცირებაში ისე, რომ არ მოგიწიოთ კომფორტზე უარის თქმა. Life Store-ში წარმოდგენილი თითოეული ნივთი შერჩეულია იმისთვის, რომ თქვენი კვების რუტინა გახდეს უფრო ჯანსაღი, ხოლო სახლის გარემო - ბევრად უსაფრთხო.",
    trustTitle: "რატომ უნდა ენდოთ Life Store-ის ხარისხს?",
    trustSubtitle: "ინტერნეტში უამრავი შემოთავაზებაა, თუმცა ჩვენთვის ხარისხი და უსაფრთხოება უპირველესია. თითოეული პროდუქტი გადის მკაცრ შერჩევას.",
    card1Title: "პრემიუმ მასალები",
    card1Desc: "ჩვენი ლანჩბოქსები და კონტეინერები დამზადებულია უმაღლესი სტანდარტის SUS 304 უჟანგავი ფოლადისა და ნაწრთობი მინისგან, რომლებიც არ შეიცავენ მავნე BPA-ს.",
    card2Title: "ბუნებრივი ესთეტიკა",
    card2Desc: "სათავსოები და აქსესუარები დამზადებულია 100%-ით ნატურალური, განახლებადი ბამბუკისგან, რომელიც სააბაზანოსა თუ სამზარეულოს გამორჩეულ სიმყუდროვეს სძენს.",
    card3Title: "ერგონომიულობა და სტილი",
    card3Desc: "ყოველი ნივთი შერჩეულია ისე, რომ იყოს მაქსიმალურად პრაქტიკული ოფისში, სკოლაში თუ მოგზაურობისას სატარებლად.",
    ctaTitle: "მდგრადი მომავალი იწყება დღეს",
    ctaText: "ჩვენ გვჯერა, რომ დიდი ცვლილებები პატარა, ყოველდღიური არჩევანით იწყება. Life Store თქვენი საიმედო პარტნიორია ამ გზაზე. შემოუერთდით ჩვენს ეკომეგობრულ ოჯახს და შეცვალეთ თქვენი ყოველდღიურობა უკეთესობისკენ.",
    viewProducts: "ყველა პროდუქტი",
  },
  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    title: "About Us | Life Store - Eco-friendly Products in Georgia",
    description:
      "Meet Life Store — eco-friendly tableware and household items. BPA-Free SUS 304 stainless steel, bamboo. A healthy environment starts at home.",
    keywords: "eco-friendly, BPA-Free, bamboo, stainless steel, lunchbox, eco products, Life Store Georgia",
    schemaName: "About Us | Life Store",
    schemaDesc: "Meet Life Store — an eco-friendly lifestyle for your everyday life. We offer BPA-Free, SUS 304 stainless steel and bamboo products.",
    home: "Home",
    aboutUs: "About Us",
    h1: "Meet Life Store — an Eco-friendly Lifestyle for Your Everyday Life",
    intro: "In today's rapidly evolving world, where plastic consumption has reached a critical point, caring for our health and the environment is the responsibility of each of us. Life Store was created to offer safe, long-lasting and aesthetic alternatives to plastic tableware and household items. Our goal is to make eco-friendly living accessible and comfortable for everyone.",
    missionTitle: "Our Mission: Safe Alternatives for Everyday Life",
    missionText: "Our goal is simple — to help you reduce plastic use without having to give up comfort. Every item at Life Store is carefully selected to make your dining routine healthier and your home environment much safer.",
    trustTitle: "Why Trust Life Store's Quality?",
    trustSubtitle: "There are countless options online, but for us quality and safety come first. Every product goes through rigorous selection.",
    card1Title: "Premium Materials",
    card1Desc: "Our lunchboxes and containers are made from the highest standard SUS 304 stainless steel and tempered glass, which contain no harmful BPA.",
    card2Title: "Natural Aesthetics",
    card2Desc: "Storage boxes and accessories are made from 100% natural, renewable bamboo, which adds a distinctive warmth to bathrooms and kitchens.",
    card3Title: "Ergonomics and Style",
    card3Desc: "Every item is chosen to be maximally practical — easy to carry at the office, school, or while travelling.",
    ctaTitle: "A Sustainable Future Starts Today",
    ctaText: "We believe great changes begin with small, everyday choices. Life Store is your reliable partner on this path. Join our eco-friendly family and transform your daily life for the better.",
    viewProducts: "All Products",
  },
  ru: {
    htmlLang: "ru",
    ogLocale: "ru_RU",
    title: "О нас | Life Store - Экологичные товары в Грузии",
    description:
      "Познакомьтесь с Life Store — экологичная посуда и товары для дома. BPA-Free нержавеющая сталь SUS 304, бамбук. Здоровая среда начинается с дома.",
    keywords: "экологичные, BPA-Free, бамбук, нержавеющая сталь, ланч-бокс, эко товары, Life Store Грузия",
    schemaName: "О нас | Life Store",
    schemaDesc: "Познакомьтесь с Life Store — экологичный образ жизни для вашего повседневья. Предлагаем BPA-Free, товары из нержавеющей стали SUS 304 и бамбука.",
    home: "Главная",
    aboutUs: "О нас",
    h1: "Познакомьтесь с Life Store — экологичный образ жизни для вашего повседневья",
    intro: "В современном стремительно развивающемся мире, где потребление пластика достигло критической отметки, забота о здоровье и окружающей среде — ответственность каждого из нас. Life Store был создан, чтобы предложить безопасные, долговечные и эстетичные альтернативы пластиковой посуде и предметам быта. Наша цель — сделать экологичный образ жизни доступным и комфортным для всех.",
    missionTitle: "Наша миссия: безопасная альтернатива для повседневной жизни",
    missionText: "Наша цель проста — помочь вам сократить использование пластика, не жертвуя комфортом. Каждый товар в Life Store подобран так, чтобы ваш режим питания стал здоровее, а домашняя обстановка — намного безопаснее.",
    trustTitle: "Почему стоит доверять качеству Life Store?",
    trustSubtitle: "В интернете множество предложений, но для нас качество и безопасность — прежде всего. Каждый продукт проходит строгий отбор.",
    card1Title: "Премиум материалы",
    card1Desc: "Наши ланч-боксы и контейнеры изготовлены из нержавеющей стали высочайшего стандарта SUS 304 и закалённого стекла, которые не содержат вредного BPA.",
    card2Title: "Натуральная эстетика",
    card2Desc: "Органайзеры и аксессуары изготовлены из 100% натурального, возобновляемого бамбука, который придаёт особый уют ванной и кухне.",
    card3Title: "Эргономика и стиль",
    card3Desc: "Каждый товар подобран так, чтобы быть максимально практичным — удобным для переноски в офисе, школе или в путешествии.",
    ctaTitle: "Устойчивое будущее начинается сегодня",
    ctaText: "Мы верим, что большие перемены начинаются с маленьких, ежедневных выборов. Life Store — ваш надёжный партнёр на этом пути. Присоединяйтесь к нашей экологичной семье и изменяйте свою повседневную жизнь к лучшему.",
    viewProducts: "Все товары",
  },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const langKey = req.query.lang === "en" ? "en" : req.query.lang === "ru" ? "ru" : "ka";

  const ua = (req.headers["user-agent"] as string) || "";
  if (!BOT_PATTERN.test(ua)) {
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.redirect(302, `/about?_spa=1`);
    return;
  }

  const c = CONTENT[langKey];

  const kaUrl = `${SITE_URL}/about`;
  const enUrl = `${SITE_URL}/en/about`;
  const ruUrl = `${SITE_URL}/ru/about`;
  const pageUrl = langKey === "en" ? enUrl : langKey === "ru" ? ruUrl : kaUrl;
  const imageUrl = `${SITE_URL}/logo.png`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Life Store",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: imageUrl },
    description: c.schemaDesc,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: [
        { "@type": "Language", name: "Georgian" },
        { "@type": "Language", name: "English" },
        { "@type": "Language", name: "Russian" },
      ],
    },
    foundingLocation: {
      "@type": "Place",
      name: langKey === "en" ? "Georgia" : langKey === "ru" ? "Грузия" : "საქართველო",
      address: { "@type": "PostalAddress", addressCountry: "GE" },
    },
  };

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: c.schemaName,
    description: c.schemaDesc,
    url: pageUrl,
    inLanguage: langKey,
    mainEntity: { "@type": "Organization", name: "Life Store", url: SITE_URL },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: c.home, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: c.aboutUs, item: pageUrl },
    ],
  };

  const html = `<!DOCTYPE html>
<html lang="${c.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(c.title)}</title>
  <meta name="description" content="${esc(c.description)}">
  <meta name="keywords" content="${esc(c.keywords)}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ka" href="${kaUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="ru" href="${ruUrl}">
  <link rel="alternate" hreflang="x-default" href="${kaUrl}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(c.title)}">
  <meta property="og:description" content="${esc(c.description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="${c.ogLocale}">
  <meta property="og:locale:alternate" content="${langKey === "ka" ? "en_US" : "ka_GE"}">
  <meta property="og:locale:alternate" content="${langKey === "ru" ? "en_US" : "ru_RU"}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(c.title)}">
  <meta name="twitter:description" content="${esc(c.description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">

  <script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(aboutPageSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">${c.home}</a> /
    <span>${c.aboutUs}</span>
  </nav>
  <main>
    <h1>${esc(c.h1)}</h1>
    <p>${esc(c.intro)}</p>

    <h2>${esc(c.missionTitle)}</h2>
    <p>${esc(c.missionText)}</p>

    <h2>${esc(c.trustTitle)}</h2>
    <p>${esc(c.trustSubtitle)}</p>

    <h3>${esc(c.card1Title)}</h3>
    <p>${esc(c.card1Desc)}</p>

    <h3>${esc(c.card2Title)}</h3>
    <p>${esc(c.card2Desc)}</p>

    <h3>${esc(c.card3Title)}</h3>
    <p>${esc(c.card3Desc)}</p>

    <h2>${esc(c.ctaTitle)}</h2>
    <p>${esc(c.ctaText)}</p>

    <a href="${SITE_URL}/products">${esc(c.viewProducts)}</a>
  </main>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache");
  res.status(200).send(html);
}
