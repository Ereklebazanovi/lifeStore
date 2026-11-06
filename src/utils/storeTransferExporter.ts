import * as XLSX from "xlsx-js-style";
import type { StoreTransfer } from "../types/storeTransfer";
import { summarizeStoreTransfers } from "./storeReporting";
import { storeTransferDateInput } from "./storeTransferDate";

export function exportStoreTransfersToExcel(transfers: StoreTransfer[]): void {
  if (!transfers.length) throw Error("ჩამოსატვირთი ჩანაწერები არ არის");
  const ordered = [...transfers].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.transferNumber.localeCompare(b.transferNumber),
  );
  const summary = summarizeStoreTransfers(ordered, null);
  const rows = ordered.flatMap((transfer) =>
    transfer.items.map((item) => [
      // Excel stores a calendar day as a number, without a timezone or time.
      (Date.UTC(transfer.date.getFullYear(), transfer.date.getMonth(), transfer.date.getDate()) - Date.UTC(1899, 11, 30)) / 86400000,
      transfer.type === "out" ? "გადატანა" : "დაბრუნება",
      transfer.transferNumber,
      item.name,
      item.quantity,
      item.price,
      Math.round(item.price * item.quantity * 100) / 100,
      transfer.note,
    ]),
  );
  const sheet = XLSX.utils.aoa_to_sheet([
    ["მაღაზია · ცინცაძის 2 — საქონლის მოძრაობა"],
    ["თარიღი — საქონლის მოძრაობის დღე; თანხა — ჩანაწერში შენახული გასაყიდი ფასით."],
    ["თარიღი", "მოქმედება", "ჩანაწერის ნომერი", "პროდუქტი / ვარიანტი", "რაოდენობა", "ერთეულის ფასი (₾)", "თანხა (₾)", "კომენტარი"],
    ...rows,
    [],
    ["", "", "", "სულ გადატანილი", summary.outQuantity, "", summary.outValue],
    ["", "", "", "სულ დაბრუნებული", summary.returnQuantity, "", summary.returnValue],
    ["", "", "", "სხვაობა (გადატანა − დაბრუნება)", summary.netQuantity, "", summary.netValue],
  ]);
  sheet["!cols"] = [16, 16, 27, 55, 14, 22, 20, 48].map((wch) => ({ wch }));
  sheet["!merges"] = [0, 1].map((r) => ({ s: { r, c: 0 }, e: { r, c: 7 } }));
  sheet["!autofilter"] = { ref: `A3:H${rows.length + 3}` };
  const end = XLSX.utils.decode_range(sheet["!ref"]!).e.r;
  for (let r = 0; r <= end; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      cell.s = {
        font: { name: "Sylfaen", sz: r === 0 ? 14 : 11, bold: r === 0 || r === 2 || r > rows.length + 3 },
        alignment: { vertical: "center", wrapText: true, horizontal: c >= 4 && c <= 6 ? "right" : "left" },
        ...(r === 2 ? { fill: { fgColor: { rgb: "E2EFDA" } } } : {}),
        ...(r >= 3 && c >= 4 && c <= 6 ? { numFmt: c === 4 ? "#,##0" : "#,##0.00" } : {}),
        ...(c === 0 && r >= 3 && r < rows.length + 3 ? { numFmt: "yyyy-mm-dd" } : {}),
      };
    }
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "მაღაზიის მოძრაობა");
  XLSX.writeFile(workbook, `მაღაზია_${storeTransferDateInput()}.xlsx`);
}
