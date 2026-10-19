// Acceptance testing uses the live database, but only the reserved TEST-STORE
// products. Enable the real catalogue after the workflow is accepted.
export const STORE_TRANSFERS_TEST_ONLY = true;

export function isStoreTestProduct(product: {
  id: string;
  qaFixtureBatch?: unknown;
}): boolean {
  return (
    product.qaFixtureBatch === "store-phase3-20261019" &&
    /^qa-store-20261019-(0[1-9]|[12]\d|30)$/.test(product.id)
  );
}
