import * as XLSX from "xlsx-js-style";
import type { StockReceipt, StockReceiptItem } from "../types/stockReceipt";
import { storeTransferDateInput } from "./storeTransferDate";

/** მიღების ჟურნალი Excel-ში — მიმდინარე ფილტრით, თითო პროდუქტის ხაზი ცალკე. */
export function exportReceiptsToExcel(
  receipts: StockReceipt[],
  display: (item: StockReceiptItem) => { name: string; code: string },
): void {
  if (!receipts.length) throw Error("ჩამოსატვირთი მიღებები არ არის");
  const ordered = [...receipts].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.receiptNumber.localeCompare(b.receiptNumber),
  );
  let totalQuantity = 0;
  let totalToStore = 0;
  const rows = ordered.flatMap((receipt) =>
    receipt.items.map((item) => {
      totalQuantity += item.quantity;
      totalToStore += item.toStore;
      const { name, code } = display(item);
      return [
        // Excel-ში კალენდარული დღე რიცხვად — დროისა და სასაათო სარტყლის გარეშე
        (Date.UTC(receipt.date.getFullYear(), receipt.date.getMonth(), receipt.date.getDate()) - Date.UTC(1899, 11, 30)) / 86400000,
        receipt.receiptNumber,
        receipt.supplier,
        receipt.documentNumber,
        code,
        name,
        item.quantity,
        item.toStore,
        item.quantity - item.toStore,
        receipt.note,
      ];
    }),
  );
  const header = ["თარიღი", "მიღების ნომერი", "მომწოდებელი", "დოკუმენტის №", "კოდი", "პროდუქტი", "მიღებული", "აქედან მაღაზიაში", "საწყობში", "კომენტარი"];
  const sheet = XLSX.utils.aoa_to_sheet([
    ["მიღება — ტვირთების ჟურნალი"],
    ["თარიღი — მიღების დღე; „აქედან მაღაზიაში“ იმავე დღეს გადავიდა მაღაზიაში."],
    header,
    ...rows,
    [],
    ["", "", "", "", "", "სულ", totalQuantity, totalToStore, totalQuantity - totalToStore],
  ]);
  sheet["!cols"] = [14, 24, 28, 18, 14, 48, 12, 18, 12, 40].map((wch) => ({ wch }));
  sheet["!merges"] = [0, 1].map((r) => ({ s: { r, c: 0 }, e: { r, c: header.length - 1 } }));
  sheet["!autofilter"] = { ref: `A3:J${rows.length + 3}` };
  const end = XLSX.utils.decode_range(sheet["!ref"]!).e.r;
  for (let r = 0; r <= end; r++) {
    for (let c = 0; c < header.length; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      cell.s = {
        font: { name: "Sylfaen", sz: r === 0 ? 14 : 11, bold: r === 0 || r === 2 || r > rows.length + 3 },
        alignment: { vertical: "center", wrapText: true, horizontal: c >= 6 && c <= 8 ? "right" : "left" },
        ...(r === 2 ? { fill: { fgColor: { rgb: "E2EFDA" } } } : {}),
        ...(r >= 3 && c >= 6 && c <= 8 ? { numFmt: "#,##0" } : {}),
        ...(c === 0 && r >= 3 && r < rows.length + 3 ? { numFmt: "yyyy-mm-dd" } : {}),
      };
    }
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "მიღება");
  XLSX.writeFile(workbook, `მიღება_${storeTransferDateInput()}.xlsx`);
}
