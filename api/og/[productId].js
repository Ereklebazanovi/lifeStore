// api/og/[productId].js - Dynamic Open Graph meta tags for products
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

export default async function handler(req, res) {
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    // Get product data from Firestore
    const productDoc = await getDoc(doc(db, 'products', productId));

    if (!productDoc.exists()) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productDoc.data();

    // Calculate actual price (considering sale price)
    const actualPrice = product.salePrice && product.salePrice < product.price
      ? product.salePrice
      : product.price;

    // Get total stock
    const totalStock = product.hasVariants && product.variants
      ? product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
      : product.stock || 0;

    // Generate HTML with proper Open Graph tags
    const html = `
<!DOCTYPE html>
<html lang="ka">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Primary Meta Tags -->
    <title>${product.name} - ₾${actualPrice.toFixed(2)} | Life Store</title>
    <meta name="description" content="${product.description.slice(0, 160)}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="https://lifestore.ge/product/${productId}">
    <meta property="og:title" content="${product.name} - ₾${actualPrice.toFixed(2)} | Life Store">
    <meta property="og:description" content="${product.description.slice(0, 120)} ✅ მარაგშია ${totalStock} ცალი 🚚 მიწოდება: თბილისი/რუსთავი 5₾, სხვა 10₾">
    <meta property="og:image" content="${product.images?.[0] || 'https://lifestore.ge/Screenshot 2025-12-10 151703.png'}">
    <meta property="og:image:alt" content="${product.name}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Life Store">
    <meta property="og:locale" content="ka_GE">

    <!-- Product specific Open Graph -->
    <meta property="product:price:amount" content="${actualPrice}">
    <meta property="product:price:currency" content="GEL">
    <meta property="product:availability" content="${totalStock > 0 ? 'instock' : 'outofstock'}">
    <meta property="product:brand" content="Life Store">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://lifestore.ge/product/${productId}">
    <meta name="twitter:title" content="${product.name} - ₾${actualPrice.toFixed(2)}">
    <meta name="twitter:description" content="${product.description.slice(0, 160)}">
    <meta name="twitter:image" content="${product.images?.[0] || 'https://lifestore.ge/Screenshot 2025-12-10 151703.png'}">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${product.name}",
      "description": "${product.description}",
      "image": "${product.images?.[0] || ''}",
      "offers": {
        "@type": "Offer",
        "price": "${actualPrice}",
        "priceCurrency": "GEL",
        "availability": "${totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}"
      },
      "brand": {
        "@type": "Brand",
        "name": "Life Store"
      }
    }
    </script>

    <!-- Redirect to main app -->
    <script>
      window.location.href = "https://lifestore.ge/product/${productId}";
    </script>
</head>
<body>
    <h1>${product.name}</h1>
    <p>ფასი: ₾${actualPrice.toFixed(2)}</p>
    <p>${product.description}</p>
    <p>გადამისამართება...</p>
</body>
</html>`;

    // Set headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=900'); // Cache for 30 min, edge cache 15 min
    res.setHeader('Vary', 'User-Agent'); // Vary by user agent for better crawling

    return res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}