// Calendar dates use the same local timezone as the admin's date filters.
export const storeTransferDateInput = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function parseStoreTransferDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw Error("მიუთითე სწორი თარიღი");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    year < 1000 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    throw Error("მიუთითე სწორი თარიღი");
  if (value > storeTransferDateInput())
    throw Error("მომავალი თარიღის მითითება შეუძლებელია");
  return date;
}
