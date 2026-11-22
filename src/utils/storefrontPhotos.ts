import type { Category, Product } from "../types";

type StorefrontPhoto = {
  original: string;
  src: string;
  cover?: boolean;
};

// Use the photographed product as the cover when the first upload is a collage or a diagram.
const preferredPhotos: Record<string, string> = {
  "blenderi-sokany-800w": "ccdpkjlgrfu6x8sv0upb.png",
  "bambukis-organeizeri-kalati-3-tsalia-nakrebi": "vvk5oftcmiwidbkdl21f.jpg",
  "lanchboksi-1400-ml-metalis-tavsakhurit-3-ganqofilebit": "x4d2mmfbkeb0xpbpdze9.png",
  "faifuris-nakrebi": "hnly5rmnzva3yhkjfotv.png",
};

const whiteBackdropPhotos = new Set([
  "kb5q5yxy9hv8ycl1f6q4.png",
  "loafzln3vuajdp8dogtz.png",
  "gjkk6lkkpmumui82phgk.png",
  "cqiwp8nj8msqfxun6ihd.png",
  "bzeonosyiwfap9w9gqhx.png",
  "hnly5rmnzva3yhkjfotv.png",
]);

const centeredPhotos = new Set(["midsjlyboggmqthbgjud.png", "xtmbhskwlpsch8lggl0m.png"]);

const categoryCovers: Record<string, { product: string; previousPhoto: string; cover?: boolean }> = {
  "bambukis-kalatebi": { product: "otkhkutkhedi-bambukis-kalata-110-lt-2-ganqofilebit-tetri-shalitit", previousPhoto: "yxs44c9h0d5guk5zwjpw.jpg" },
  "electric-appliances": { product: "blenderi-sokany-800w", previousPhoto: "gqhq2ru2z1etc0vfxsux.png" },
  "lanchboksebi": { product: "lanchboksi-850-ml-metalis-tavsakhurit-3-ganqofilebit", previousPhoto: "lpgmws5w1hyyzlg2ru5n.jpg", cover: true },
  "qvelis-dafebi": { product: "qvelis-dafa-keramikit-da-aksesuarebit-tetri", previousPhoto: "qjbumbj44jx5yb6sl5pt.jpg", cover: true },
  "minis-konteinerebi": { product: "minis-konteinerebis-nakrebi-mrgvali", previousPhoto: "inrbdevrndgiwmokagq9.png" },
  "faifuris-nakrebebi": { product: "faifuris-nakrebi", previousPhoto: "djhh48pf0d6dq7qi9d5x.jpg" },
  "sakarakeebi": { product: "minis-sakarake-bambukis-dafit-da-danit", previousPhoto: "j7svqnsarni6vp3ca640.jpg" },
  "sapureebi": { product: "sapure-nakrebi", previousPhoto: "kfw2rsfearw9zihsjfj8.jpg", cover: true },
};

function fileName(url: string) {
  return url.split(/[?#]/, 1)[0].split("/").pop();
}

export function getProductCover(product: Product) {
  const preferred = product.slug && preferredPhotos[product.slug];
  return (preferred && product.images?.find(url => fileName(url) === preferred)) || product.images?.[0];
}

export function getProductPhoto(product: Product): StorefrontPhoto | undefined {
  const original = getProductCover(product);
  if (!original) return undefined;

  const name = fileName(original) ?? "";
  const src = whiteBackdropPhotos.has(name)
    ? original.replace(
        /^(https:\/\/res\.cloudinary\.com\/domclcimy\/image\/upload\/)f_auto,q_auto,w_\d+\/(v\d+\/)/,
        "$1e_trim:10/c_fit,h_560,w_560/c_lpad,b_white,h_640,w_640/f_auto,q_auto/$2",
      )
    : original;
  return { original, src, cover: centeredPhotos.has(name) };
}

export function getCategoryPhoto(category: Category, products: Product[]): StorefrontPhoto | undefined {
  const choice = categoryCovers[category.slug];
  // A newly uploaded category photo takes precedence over this selection.
  if (choice && category.image && fileName(category.image) === choice.previousPhoto) {
    const product = products.find(item => item.slug === choice.product && item.isActive !== false);
    const photo = product && getProductPhoto(product);
    if (photo) return { ...photo, cover: choice.cover };
  }
  return category.image ? { src: category.image, original: category.image } : undefined;
}
