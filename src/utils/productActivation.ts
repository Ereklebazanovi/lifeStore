// საიტზე ჩართვის პირობები (docs/stock-receipts.md §2).
// მოწმდება მხოლოდ გამორთულიდან ჩართვისას — უკვე აქტიურ პროდუქტს არ ეხება, გამორთვას არაფერი აბრკოლებს.

export interface ActivationInput {
  images?: string[];
  price?: number;
  category?: string;
  description?: string;
}

/** რა აკლია პროდუქტს საიტზე გამოსაჩენად; ცარიელი სია = ჩართვა შეიძლება. */
export function getActivationProblems(product: ActivationInput, categoryNames: string[] = []): string[] {
  const problems: string[] = [];
  if (!product.images?.some((image) => typeof image === "string" && image.trim())) problems.push("ფოტო");
  if (!(typeof product.price === "number" && Number.isFinite(product.price) && product.price > 0)) problems.push("ფასი");
  const category = product.category?.trim() || "";
  // საიტი პროდუქტს კატეგორიას სახელის ზუსტი დამთხვევით აკავშირებს (utils/catalog.ts)
  if (!category) problems.push("კატეგორია");
  else if (categoryNames.length && !categoryNames.includes(category)) problems.push("არსებული კატეგორია");
  if (!product.description?.trim()) problems.push("ქართული აღწერა");
  return problems;
}

export const activationErrorMessage = (problems: string[]): string =>
  `საიტზე ვერ ჩაირთო — არ აქვს: ${problems.join(", ")}`;
