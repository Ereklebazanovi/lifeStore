// scripts/generate-product-pages.js
// Generates static HTML files for each product - VIFA blog style
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function escapeJson(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getOptimizedImageUrl(imageUrl) {
  if (!imageUrl) return 'https://lifestore.ge/logo.png';
  if (imageUrl.includes('cloudinary.com')) {
    return imageUrl.replace(/\/f_auto,q_auto,w_\d+\//, '/w_1200,h_630,c_fill,f_jpg,q_80/');
  }
  return imageUrl;
}

function generateProductHTML(product) {
  const actualPrice = product.salePrice && product.salePrice < product.price
    ? product.salePrice
    : product.price;

  const totalStock = product.hasVariants && product.variants
    ? product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
    : product.stock || 0;

  const discountPercent = product.salePrice && product.salePrice < product.price
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const stockStatus = totalStock > 0 ? 'მარაგშია' : 'ამოწურულია';
  const availability = totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const ogImage = getOptimizedImageUrl(product.images?.[0]);

  return `<!DOCTYPE html>
<html lang="ka">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Primary Meta Tags -->
    <title>${escapeHtml(product.name)} - ₾${actualPrice.toFixed(2)} | Life Store</title>
    <meta name="description" content="${escapeHtml(product.description?.slice(0, 160) || product.name)}">
    <meta name="keywords" content="${escapeHtml(product.name)}, ${escapeHtml(product.category)}, ეკომეგობრული ნივთები, Life Store">
    <link rel="canonical" href="https://lifestore.ge/product/${product.id}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="https://lifestore.ge/product/${product.id}">
    <meta property="og:title" content="${escapeHtml(product.name)} - ₾${actualPrice.toFixed(2)}${discountPercent > 0 ? ` (${discountPercent}% ფასდაკლება!)` : ''}">
    <meta property="og:description" content="${escapeHtml(product.description?.slice(0, 160) || product.name)} ✅ ${stockStatus}${totalStock > 0 ? ` ${totalStock} ცალი` : ''}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${escapeHtml(product.name)}">
    <meta property="og:site_name" content="Life Store">
    <meta property="og:locale" content="ka_GE">

    <!-- Product specific Open Graph -->
    <meta property="product:price:amount" content="${actualPrice}">
    <meta property="product:price:currency" content="GEL">
    <meta property="product:availability" content="${totalStock > 0 ? 'instock' : 'outofstock'}">
    <meta property="product:brand" content="Life Store">
    <meta property="product:category" content="${escapeHtml(product.category)}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(product.name)} - ₾${actualPrice.toFixed(2)}">
    <meta name="twitter:description" content="${escapeHtml(product.description?.slice(0, 160) || product.name)}">
    <meta name="twitter:image" content="${ogImage}">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${escapeJson(product.name)}",
      "description": "${escapeJson(product.description || product.name)}",
      "image": "${ogImage}",
      "brand": {
        "@type": "Brand",
        "name": "Life Store"
      },
      "category": "${escapeJson(product.category)}",
      "offers": {
        "@type": "Offer",
        "price": "${actualPrice}",
        "priceCurrency": "GEL",
        "availability": "${availability}",
        "url": "https://lifestore.ge/product/${product.id}",
        "seller": {
          "@type": "Organization",
          "name": "Life Store"
        }
      }
    }
    </script>

    <!-- Redirect to main app -->
    <script>
      const isBot = /bot|crawler|spider|facebookexternalhit|twitterbot|whatsapp|linkedinbot|telegrambot/i.test(navigator.userAgent);
      if (!isBot) {
        window.location.replace("https://lifestore.ge/?redirect=product/${product.id}");
      }
    </script>

    <link rel="icon" type="image/png" href="/logo.png">
</head>
<body>
    <div style="font-family: 'Noto Sans Georgian', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <header>
            <a href="https://lifestore.ge" style="text-decoration: none; color: #059669; font-weight: bold;">← Life Store</a>
            <h1>${escapeHtml(product.name)}</h1>
            <p style="color: ${hasCurrentDiscount(product) ? '#dc2626' : '#059669'}; font-size: 24px; font-weight: bold;">
                ₾${actualPrice.toFixed(2)}
                ${discountPercent > 0 ? `<span style="color: #9ca3af; text-decoration: line-through; font-size: 18px; margin-left: 10px;">₾${product.price.toFixed(2)}</span>` : ''}
            </p>
            <p style="color: ${totalStock > 0 ? '#059669' : '#dc2626'};">
                ${stockStatus}${totalStock > 0 ? ` (${totalStock} ცალი)` : ''}
            </p>
        </header>

        <main>
            ${product.images?.[0] ? `<img src="${ogImage}" alt="${escapeHtml(product.name)}" style="max-width: 100%; height: 400px; object-fit: contain; border-radius: 12px;">` : ''}
            <p><strong>კატეგორია:</strong> ${escapeHtml(product.category)}</p>
            <p>${escapeHtml(product.description || '')}</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3>🌿 Life Store - ეკომეგობრული სახლის ნივთები</h3>
                <ul>
                    <li>✅ 100% ეკომეგობრული</li>
                    <li>🚚 მიწოდება: თბილისი/რუსთავი 5₾, სხვა 10₾</li>
                    <li>🛡️ ხარისხის გარანტია</li>
                </ul>
            </div>

            <p style="text-align: center; margin: 30px 0;">
                <a href="https://lifestore.ge/?redirect=product/${product.id}"
                   style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    🛒 შეუკვეთეთ ახლავე
                </a>
            </p>
        </main>
    </div>
</body>
</html>`;
}

function hasCurrentDiscount(product) {
  return product.salePrice && product.salePrice < product.price;
}

function generateSitemapXml(products, today) {
  const staticUrls = [
    { loc: 'https://lifestore.ge/', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://lifestore.ge/products', priority: '0.9', changefreq: 'daily' },
    { loc: 'https://lifestore.ge/about', priority: '0.8', changefreq: 'monthly' },
    { loc: 'https://lifestore.ge/privacy-policy', priority: '0.6', changefreq: 'monthly' },
    { loc: 'https://lifestore.ge/terms', priority: '0.6', changefreq: 'monthly' },
    { loc: 'https://lifestore.ge/refund-policy', priority: '0.6', changefreq: 'monthly' },
  ];

  const staticEntries = staticUrls.map(({ loc, priority, changefreq }) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('');

  const productEntries = products.map(p => `
  <url>
    <loc>https://lifestore.ge/product/${p.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${productEntries}
</urlset>`;
}

async function generateAllProductPages() {
  try {
    console.log('🚀 Starting product pages generation...');

    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = [];

    productsSnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📦 Found ${products.length} products`);

    const productDir = path.join(process.cwd(), 'dist', 'product');
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }

    const activeProducts = [];
    let generated = 0;

    for (const product of products) {
      if (!product.isActive) continue;

      const productPath = path.join(productDir, product.id);
      const htmlPath = path.join(productPath, 'index.html');

      if (!fs.existsSync(productPath)) {
        fs.mkdirSync(productPath, { recursive: true });
      }

      fs.writeFileSync(htmlPath, generateProductHTML(product), 'utf-8');
      activeProducts.push(product);
      generated++;
      console.log(`✅ Generated: /product/${product.id}/index.html`);
    }

    // Update sitemap.xml with all product URLs
    const today = new Date().toISOString().split('T')[0];
    const sitemapContent = generateSitemapXml(activeProducts, today);

    const sitemapPath = path.join(process.cwd(), 'dist', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
    console.log(`🗺️  Updated sitemap.xml with ${activeProducts.length} products`);

    console.log(`🎉 Successfully generated ${generated} product pages!`);

  } catch (error) {
    console.error('❌ Error generating product pages:', error);
    process.exit(1);
  }
}

generateAllProductPages();
