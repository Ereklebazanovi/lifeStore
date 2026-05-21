// Georgian → Latin transliteration table (National System)
const GEO_TO_LATIN: Record<string, string> = {
  'ა': 'a',  'ბ': 'b',  'გ': 'g',  'დ': 'd',  'ე': 'e',  'ვ': 'v',  'ზ': 'z',
  'თ': 't',  'ი': 'i',  'კ': 'k',  'ლ': 'l',  'მ': 'm',  'ნ': 'n',  'ო': 'o',
  'პ': 'p',  'ჟ': 'zh', 'რ': 'r',  'ს': 's',  'ტ': 't',  'უ': 'u',  'ფ': 'f',
  'ქ': 'k',  'ღ': 'gh', 'ყ': 'q',  'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j',  'ჰ': 'h',
};

export function generateProductSlug(name: string): string {
  let result = '';
  for (const char of name.toLowerCase()) {
    if (GEO_TO_LATIN[char]) {
      result += GEO_TO_LATIN[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else {
      result += '-';
    }
  }
  return result
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Firestore auto-generated IDs always contain uppercase letters; slugs never do
export function isFirestoreId(value: string): boolean {
  return /[A-Z]/.test(value);
}

export function getProductUrl(product: { id: string; slug?: string }): string {
  return `/product/${product.slug || product.id}`;
}
