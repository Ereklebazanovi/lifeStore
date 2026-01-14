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

function generateProductHTML(product) {
  // Calculate actual price (considering sale price)
  const actualPrice = product.salePrice && product.salePrice < product.price
    ? product.salePrice
    : product.price;

  // Get total stock
  const totalStock = product.hasVariants && product.variants
    ? product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
    : product.stock || 0;

  // Calculate discount percentage
  const discountPercent = product.salePrice && product.salePrice < product.price
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const stockStatus = totalStock > 0 ? 'მარაგშია' : 'ამოწურულია';
  const availability = totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  return `<!DOCTYPE html>
<html lang="ka">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Primary Meta Tags -->
    <title>${product.name} - ₾${actualPrice.toFixed(2)} | Life Store</title>
    <meta name="description" content="${product.description?.slice(0, 160) || product.name}">
    <meta name="keywords" content="${product.name}, ${product.category}, ეკომეგობრული ნივთები, Life Store">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="https://lifestore.ge/product/${product.id}">
    <meta property="og:title" content="${product.name} - ₾${actualPrice.toFixed(2)} ${discountPercent > 0 ? `(${discountPercent}% ფასდაკლება!)` : ''}">
    <meta property="og:description" content="${product.description?.slice(0, 160) || product.name} ✅ ${stockStatus} ${totalStock > 0 ? `${totalStock} ცალი` : ''}">
    <meta property="og:image" content="${product.images?.[0] || 'https://lifestore.ge/Screenshot 2025-12-10 151703.png'}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Life Store">
    <meta property="og:locale" content="ka_GE">

    <!-- Product specific Open Graph -->
    <meta property="product:price:amount" content="${actualPrice}">
    <meta property="product:price:currency" content="GEL">
    <meta property="product:availability" content="${totalStock > 0 ? 'instock' : 'outofstock'}">
    <meta property="product:brand" content="Life Store">
    <meta property="product:category" content="${product.category}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${product.name} - ₾${actualPrice.toFixed(2)}">
    <meta name="twitter:description" content="${product.description?.slice(0, 160) || product.name}">
    <meta name="twitter:image" content="${product.images?.[0] || 'https://lifestore.ge/Screenshot 2025-12-10 151703.png'}">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${product.name}",
      "description": "${product.description || product.name}",
      "image": "${product.images?.[0] || 'https://lifestore.ge/Screenshot 2025-12-10 151703.png'}",
      "brand": {
        "@type": "Brand",
        "name": "Life Store"
      },
      "category": "${product.category}",
      "offers": {
        "@type": "Offer",
        "price": "${actualPrice}",
        "priceCurrency": "GEL",
        "availability": "${availability}",
        "seller": {
          "@type": "Organization",
          "name": "Life Store"
        }
      }${discountPercent > 0 ? `,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "reviewCount": "1"
      }` : ''}
    }
    </script>

    <!-- Redirect to main app after meta tags are read -->
    <script>
      // Check if this is a bot/crawler (they usually don't execute JS)
      const isBot = /bot|crawler|spider|facebook|twitter|whatsapp/i.test(navigator.userAgent);

      if (!isBot) {
        // Human user - redirect to main React app root and let React Router handle routing
        setTimeout(() => {
          window.location.href = "https://lifestore.ge/?redirect=product/${product.id}";
        }, 500);
      }
    </script>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/Screenshot 2025-12-10 151703.png">
</head>
<body>
    <!-- Content for bots and users with JS disabled -->
    <div style="font-family: 'Noto Sans Georgian', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <header>
            <h1>${product.name}</h1>
            <p style="color: #059669; font-size: 24px; font-weight: bold;">
                ₾${actualPrice.toFixed(2)}
                ${discountPercent > 0 ? `<span style="color: #dc2626; text-decoration: line-through; font-size: 18px; margin-left: 10px;">₾${product.price.toFixed(2)}</span>` : ''}
            </p>
            <p style="color: ${totalStock > 0 ? '#059669' : '#dc2626'};">
                ${stockStatus} ${totalStock > 0 ? `(${totalStock} ცალი)` : ''}
            </p>
        </header>

        <main>
            ${product.images?.[0] ? `<img src="${product.images[0]}" alt="${product.name}" style="max-width: 100%; height: 400px; object-fit: contain; border-radius: 12px;">` : ''}

            <p><strong>კატეგორია:</strong> ${product.category}</p>
            <p>${product.description || ''}</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3>🌿 Life Store - ეკომეგობრული სახლის ნივთები</h3>
                <ul>
                    <li>✅ 100% ეკომეგობრული</li>
                    <li>🚚 უფასო მიწოდება თბილისში</li>
                    <li>🛡️ ხარისხის გარანტია</li>
                </ul>
            </div>

            <p style="text-align: center; margin: 30px 0;">
                <a href="https://lifestore.ge/product/${product.id}"
                   style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    🛒 შეუკვეთეთ ახლავე
                </a>
            </p>
        </main>
    </div>

    <!-- Loading animation for redirecting users -->
    <div id="redirecting" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; display: none;">
        <p>გადამისამართება მთავარ საიტზე...</p>
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #059669; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
    </div>

    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>

    <script>
      // Show loading for human users
      const isBot = /bot|crawler|spider|facebook|twitter|whatsapp/i.test(navigator.userAgent);
      if (!isBot) {
        document.getElementById('redirecting').style.display = 'block';
      }
    </script>
</body>
</html>`;
}

async function generateAllProductPages() {
  try {
    console.log('🚀 Starting product pages generation...');

    // Get all products from Firebase
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = [];

    productsSnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`📦 Found ${products.length} products`);

    // Ensure dist/product directory exists
    const productDir = path.join(process.cwd(), 'dist', 'product');
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
      console.log('📁 Created /dist/product directory');
    }

    // Generate HTML for each product
    let generated = 0;
    for (const product of products) {
      if (!product.isActive) continue; // Skip inactive products

      const productPath = path.join(productDir, product.id);
      const htmlPath = path.join(productPath, 'index.html');

      // Create product-specific directory
      if (!fs.existsSync(productPath)) {
        fs.mkdirSync(productPath, { recursive: true });
      }

      // Generate HTML content
      const htmlContent = generateProductHTML(product);

      // Write HTML file
      fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
      generated++;

      console.log(`✅ Generated: /product/${product.id}/index.html`);
    }

    console.log(`🎉 Successfully generated ${generated} product pages!`);
    console.log('📝 Each product now has its own static HTML with proper Open Graph tags');

  } catch (error) {
    console.error('❌ Error generating product pages:', error);
    process.exit(1);
  }
}

// Run the generator
generateAllProductPages();