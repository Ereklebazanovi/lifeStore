//excelExporter.ts
import * as XLSX from "xlsx-js-style";
import type { Order, Product, ProductVariant, StockHistory } from "../types";
import { getOrderItemDisplayName } from "./displayHelpers";

const getStockAtDate = (stockHistory: StockHistory[] | undefined, targetDate: Date): number => {
  if (!stockHistory || stockHistory.length === 0) {
    return 0;
  }

  const relevantHistory = stockHistory.filter(h => {
    // Handle Firebase Timestamp objects
    const historyDate = h.timestamp instanceof Date
      ? h.timestamp
      : typeof h.timestamp === 'object' && h.timestamp !== null && 'toDate' in h.timestamp
        ? (h.timestamp as any).toDate()
        : new Date(h.timestamp as any);

    return historyDate <= targetDate;
  });

  if (relevantHistory.length === 0) {
    return 0;
  }

  relevantHistory.sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : typeof a.timestamp === 'object' && a.timestamp !== null && 'toDate' in a.timestamp ? (a.timestamp as any).toDate() : new Date(a.timestamp as any);
    const dateB = b.timestamp instanceof Date ? b.timestamp : typeof b.timestamp === 'object' && b.timestamp !== null && 'toDate' in b.timestamp ? (b.timestamp as any).toDate() : new Date(b.timestamp as any);
    return dateB.getTime() - dateA.getTime();
  });

  return relevantHistory[0].quantity;
};

// Helper function to calculate stock movements for a given date range
const getStockMovements = (
  stockHistory: StockHistory[] | undefined,
  startDate: Date,
  endDate: Date
): { incoming: number; outgoing: number } => {
  if (!stockHistory || stockHistory.length === 0) {
    return { incoming: 0, outgoing: 0 };
  }

  // Filter history within the date range
  const relevantHistory = stockHistory.filter(h => {
    const historyDate = h.timestamp instanceof Date
      ? h.timestamp
      : typeof h.timestamp === 'object' && h.timestamp !== null && 'toDate' in h.timestamp
        ? (h.timestamp as any).toDate()
        : new Date(h.timestamp as any);

    return historyDate >= startDate && historyDate <= endDate;
  });

  if (relevantHistory.length === 0) {
    return { incoming: 0, outgoing: 0 };
  }

  // Sort by timestamp to get movement sequence
  relevantHistory.sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : typeof a.timestamp === 'object' && a.timestamp !== null && 'toDate' in a.timestamp ? (a.timestamp as any).toDate() : new Date(a.timestamp as any);
    const dateB = b.timestamp instanceof Date ? b.timestamp : typeof b.timestamp === 'object' && b.timestamp !== null && 'toDate' in b.timestamp ? (b.timestamp as any).toDate() : new Date(b.timestamp as any);
    return dateA.getTime() - dateB.getTime();
  });

  let incoming = 0;
  let outgoing = 0;
  let previousQuantity = relevantHistory[0].quantity;

  for (let i = 1; i < relevantHistory.length; i++) {
    const currentQuantity = relevantHistory[i].quantity;
    const change = currentQuantity - previousQuantity;

    if (change > 0) {
      incoming += change;
    } else if (change < 0) {
      outgoing += Math.abs(change);
    }

    previousQuantity = currentQuantity;
  }

  return { incoming, outgoing };
};

// Calculate turnover data for products in a given date range
export const calculateTurnover = (
  products: Product[],
  selectedProductIds: Set<string>,
  startDate: Date,
  endDate: Date
): TurnoverData[] => {
  const turnoverData: TurnoverData[] = [];

  // Adjust dates properly
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  // For initial stock, we need the stock BEFORE the start date (not including)
  const beforeStartDate = new Date(startDate);
  beforeStartDate.setMilliseconds(beforeStartDate.getMilliseconds() - 1);

  // Filter products
  const productsToAnalyze = selectedProductIds.size > 0
    ? products.filter(p => selectedProductIds.has(p.id))
    : products;

  productsToAnalyze.forEach((product) => {
    // Handle all products as simple products (no variants)
    const openingQuantity = getStockAtDate(product.stockHistory, beforeStartDate);
    const closingQuantity = getStockAtDate(product.stockHistory, adjustedEndDate);
    const movements = getStockMovements(product.stockHistory, startDate, adjustedEndDate);

    const quantityIn = movements.incoming;
    const quantityOut = movements.outgoing;
    const difference = quantityIn - quantityOut;

    turnoverData.push({
      productCode: product.productCode || "-",
      productName: product.name,
      unit: "ცალი",
      openingQuantity,
      quantityIn,
      quantityOut,
      difference,
      closingQuantity
    });
  });

  return turnoverData.filter(item =>
    item.openingQuantity > 0 ||
    item.quantityIn > 0 ||
    item.quantityOut > 0 ||
    item.closingQuantity > 0
  );
};

// Helper function to prepare order data for Excel export
const prepareOrderDataForExcel = (order: Order) => {
  const orderDate = order.createdAt instanceof Date
    ? order.createdAt
    : new Date(order.createdAt as any);

  const formattedDate = orderDate.toLocaleDateString("ka-GE");
  const address = `${order.deliveryInfo.city}, ${order.deliveryInfo.address}`;
  const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`.trim();
  const paymentMethodText =
    order.paymentMethod === "cash"
      ? "ნაღდი ფული"
      : order.paymentMethod === "tbc_bank"
      ? "TBC ბანკი"
      : order.paymentMethod === "flitt"
      ? "Flitt"
      : order.paymentMethod === "visa"
      ? "Visa"
      : order.paymentMethod === "mastercard"
      ? "MasterCard"
      : "საბანკო გადარიცხვა";

  const shippingCost = order.deliveryInfo.shippingCost || 0;
  const totalAllItems = order.items.reduce((sum, item) => sum + item.total, 0);
  const orderGrandTotal = totalAllItems + shippingCost;

  return {
    formattedDate,
    address,
    customerName,
    paymentMethodText,
    shippingCost,
    orderGrandTotal
  };
};

// Helper function to create row data for a single order item
const createOrderItemRowData = (
  order: Order,
  item: any,
  index: number,
  preparedData: ReturnType<typeof prepareOrderDataForExcel>
) => {
  const { formattedDate, address, customerName, paymentMethodText, shippingCost, orderGrandTotal } = preparedData;

  const sku = item.product.productCode || "-";
  const productName = getOrderItemDisplayName(item);
  const quantity = item.quantity;
  const unitPrice = item.price;

  const rowData: any = {
    "თარიღი": formattedDate,
    "შეკვეთის ნომერი": order.orderNumber,
    "სტატუსი": order.orderStatus,
    "პროდუქტის კოდი": sku,
    "პროდუქტის დასახელება": productName,
    "რაოდენობა": quantity,
    "ერთეულის ფასი": unitPrice,
    "საკურიერო თანხა": index === 0 ? shippingCost : "",
    "სულ თანხა": index === 0 ? orderGrandTotal : "",
    "გადახდის მეთოდი": paymentMethodText,
    "მყიდველი": customerName,
    "ტელეფონის ნომერი": order.customerInfo.phone,
    "მისამართი": address,
    "კომენტარი": order.deliveryInfo.comment || "",
  };

  // Only add cancellation reason column if order is cancelled and has a reason
  if (order.orderStatus === "cancelled" && (order.cancelReason || order.cancellationReason)) {
    rowData["გაუქმების მიზეზი"] = order.cancelReason || order.cancellationReason;
  }

  return rowData;
};

// Helper function to get column widths based on whether there are cancelled orders
const getColumnWidths = (hasCancelledOrders: boolean) => {
  const baseColWidths = [
    { wch: 16 }, // თარიღი
    { wch: 18 }, // შეკვეთის ნომერი
    { wch: 14 }, // სტატუსი
    { wch: 15 }, // პროდუქტის კოდი
    { wch: 30 }, // პროდუქტის დასახელება
    { wch: 12 }, // რაოდენობა
    { wch: 15 }, // ერთეულის ფასი
    { wch: 16 }, // საკურიერო თანხა
    { wch: 14 }, // სულ თანხა
    { wch: 16 }, // გადახდის მეთოდი
    { wch: 18 }, // მყიდველი
    { wch: 16 }, // ტელეფონის ნომერი
    { wch: 28 }, // მისამართი
    { wch: 28 }, // კომენტარი
  ];

  return hasCancelledOrders
    ? [...baseColWidths, { wch: 25 }] // გაუქმების მიზეზი
    : baseColWidths;
};

// Helper function to apply Excel styling
const applyExcelStyling = (worksheet: any, flattenedData: any[], colWidths: any[], isMultipleOrders: boolean = false) => {
  worksheet["!cols"] = colWidths;

  // Header style - Bold with light gray background
  const headerStyle = {
    font: { bold: true, sz: 12, color: { rgb: "000000" } },
    fill: { fgColor: { rgb: "D9E1F2" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  // Apply header styling
  const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!worksheet[address]) continue;
    worksheet[address].s = headerStyle;
  }

  // Highlight order number column when order changes (for multiple orders)
  const yellowFill = { fgColor: { rgb: "FFFF99" } }; // ყვითალი
  let lastOrderNumber = null;

  const totalColumns = colWidths.length;
  for (let row = 2; row <= flattenedData.length + 1; row++) {
    let isNewOrder = false;

    if (isMultipleOrders) {
      const orderNumberCell = "B" + row;
      const currentOrderNumber = worksheet[orderNumberCell]?.v;
      isNewOrder = currentOrderNumber !== lastOrderNumber;

      if (isNewOrder) {
        lastOrderNumber = currentOrderNumber;
      }
    }

    for (let col = 0; col < totalColumns; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });
      if (!worksheet[cellAddress]) continue;
      if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};

      // ყვითელი ფერი მხოლოდ სვეტი B-ში (შეკვეთის ნომერი) როდესაც იწყება ახალი შეკვეთა
      if (col === 1 && isNewOrder && isMultipleOrders) { // col 1 = column B
        worksheet[cellAddress].s.fill = yellowFill;
      }

      // Center alignment for most columns
      worksheet[cellAddress].s.alignment = {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      };

      // Right alignment for numeric columns (F, G, H, I)
      const colLetter = XLSX.utils.encode_col(col);
      if (["F", "G", "H", "I"].includes(colLetter)) {
        worksheet[cellAddress].s.alignment = {
          horizontal: "right",
          vertical: "center",
          wrapText: true,
        };
        // Number format for these columns
        if (worksheet[cellAddress].v !== "" && worksheet[cellAddress].v !== undefined) {
          worksheet[cellAddress].s.numFmt = "#,##0.00";
        }
      }

      // Borders for all cells
      worksheet[cellAddress].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
    }
  }

  worksheet["!rows"] = [{ hpx: 35 }];
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
};

export const exportSingleOrderToExcel = (order: Order) => {
  try {
    const flattenedData: any[] = [];
    const preparedData = prepareOrderDataForExcel(order);

    order.items.forEach((item, index) => {
      const rowData = createOrderItemRowData(order, item, index, preparedData);
      flattenedData.push(rowData);
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, order.orderNumber);

    const hasCancelledOrder = order.orderStatus === "cancelled" && !!(order.cancelReason || order.cancellationReason);
    const colWidths = getColumnWidths(hasCancelledOrder);

    applyExcelStyling(worksheet, flattenedData, colWidths, false);

    const filename = `შეკვეთა_${order.orderNumber}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return true;
  } catch (error) {
    console.error("Excel export error:", error);
    return false;
  }
};

export const exportMultipleOrdersToExcel = (orders: Order[]) => {
  try {
    const flattenedData: any[] = [];

    orders.forEach((order) => {
      const preparedData = prepareOrderDataForExcel(order);

      order.items.forEach((item, index) => {
        const rowData = createOrderItemRowData(order, item, index, preparedData);
        flattenedData.push(rowData);
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "შეკვეთები");

    // Check if any order in the dataset is cancelled and has reason
    const hasCancelledOrders = orders.some(order =>
      order.orderStatus === "cancelled" && (order.cancelReason || order.cancellationReason)
    );

    const colWidths = getColumnWidths(hasCancelledOrders);

    applyExcelStyling(worksheet, flattenedData, colWidths, true);

    const filename = `შეკვეთები_ექსპორტი_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return true;
  } catch (error) {
    console.error("Excel export error:", error);
    return false;
  }
};

// ინვენტარის ექსპორტი
export interface InventoryExportData {
  productId: string;
  productName: string;
  productCode?: string;
  category?: string;
  variantName?: string;
  price: number;
  stock: number;
  totalValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TurnoverData {
  productCode: string;
  productName: string;
  unit: string;
  openingQuantity: number;
  quantityIn: number;
  quantityOut: number;
  difference: number;
  closingQuantity: number;
}

export const exportInventoryToExcel = (
  products: Product[],
  selectedProductIds: Set<string>,
  dateRange?: { startDate: Date; endDate: Date }
) => {
  try {
    const flattenedData: any[] = [];
    
    // 1. მონაცემების ფილტრაცია
    const productsToExport = selectedProductIds.size > 0 
      ? products.filter(p => selectedProductIds.has(p.id))
      : products; 

      // ✅ შესწორება: დროის გასწორება დღის ბოლომდე
    let adjustedEndDate: Date | undefined;
    if (dateRange) {
      adjustedEndDate = new Date(dateRange.endDate);
      // ვაყენებთ დღის ბოლო წამზე (23:59:59), რომ მთელი დღის ჩანაწერები მოყვეს
      adjustedEndDate.setHours(23, 59, 59, 999);
    }

    // 2. სათაურის ტექსტის მომზადება
    const todayStr = new Date().toLocaleDateString("ka-GE");
    const reportTitle = dateRange 
      ? `მარაგის ანგარიში: ${dateRange.startDate.toLocaleDateString("ka-GE")} - ${dateRange.endDate.toLocaleDateString("ka-GE")}`
      : `მიმდინარე ნაშთი (LIVE): ${todayStr}`;

    let grandTotalStock = 0;
    let grandTotalValue = 0;

    // 3. მონაცემების დამუშავება
    productsToExport.forEach((product) => {
      // All products as simple products
      const stock = dateRange && adjustedEndDate ? getStockAtDate(product.stockHistory, adjustedEndDate) : (product.stock || 0);
      const price = product.price || 0;
      const totalValue = stock * price;

      grandTotalStock += stock;
      grandTotalValue += totalValue;

      flattenedData.push({
        "პროდუქტის დასახელება": product.name,
        "პროდუქტის კოდი": product.productCode || "-",
        "კატეგორია": product.category || "-",
        "ერთეულის ფასი (₾)": price,
        "მარაგი (ცალი)": stock,
        "ჯამური ღირებულება (₾)": totalValue,
      });
    });

    // 4. ჯამური სტრიქონის დამატება
    flattenedData.push({
      "პროდუქტის დასახელება": "სულ ჯამში:",
      "პროდუქტის კოდი": "",
      "კატეგორია": "",
      "ერთეულის ფასი (₾)": "",
      "მარაგი (ცალი)": grandTotalStock,
      "ჯამური ღირებულება (₾)": grandTotalValue,
    });

    // 5. ექსელის აწყობა
    // ჯერ სათაური A1-ში
    const worksheet = XLSX.utils.aoa_to_sheet([[reportTitle]]);

    // შემდეგ მონაცემები A2-დან
    XLSX.utils.sheet_add_json(worksheet, flattenedData, { origin: "A2" });

    const workbook = XLSX.utils.book_new();

    // A1 უჯრის გაერთიანება (Merge) მთელ სიგანეზე (A-დან F-მდე)
    if(!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }); // Row 0, Col 0 to Col 5

    // 6. სვეტების სიგანეები
    const colWidths = [
      { wch: 30 }, // A: სახელი
      { wch: 15 }, // B: SKU
      { wch: 15 }, // C: კატეგორია
      { wch: 15 }, // D: ფასი
      { wch: 15 }, // E: მარაგი
      { wch: 20 }, // F: ჯამი
    ];
    worksheet["!cols"] = colWidths;

    // 7. სტილები
    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    // სტილი მთავარი სათაურისთვის (Row 1)
    const titleStyle = {
      font: { bold: true, sz: 14, color: { rgb: "4472C4" } }, // ლურჯი ტექსტი
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "FFFFFF" } } // თეთრი ფონი
    };

    // სტილი ჰედერისთვის (Row 2) - მუქი ლურჯი
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "4472C4" } }, 
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: borderStyle,
    };

    // სტილი ჯამური სტრიქონისთვის (ბოლო რიგი)
    const summaryStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E2EFDA" } }, // ღია მწვანე/ყვითელი
      border: borderStyle,
      alignment: { horizontal: "right" }
    };

    // ყვითელი სვეტი ფულისთვის
    const currencyYellowStyle = {
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: "#,##0.00",
      fill: { fgColor: { rgb: "FFF9C4" } },
      border: borderStyle
    };

    const currencyStyle = {
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: "#,##0.00",
      border: borderStyle
    };

    const centerStyle = {
      alignment: { horizontal: "center", vertical: "center" },
      border: borderStyle
    };

    const leftStyle = {
      alignment: { horizontal: "left", vertical: "center" },
      border: borderStyle
    };

    // სათაურის სტილის დადება (A1)
    if(!worksheet["A1"].s) worksheet["A1"].s = {};
    worksheet["A1"].s = titleStyle;
    // სიმაღლე სათაურისთვის
    if(!worksheet["!rows"]) worksheet["!rows"] = [];
    worksheet["!rows"][0] = { hpx: 30 };
    worksheet["!rows"][1] = { hpx: 25 }; // Header height

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    const lastRowIndex = range.e.r;

    // ციკლი ყველა უჯრაზე
    for (let R = 1; R <= lastRowIndex; ++R) { // ვიწყებთ 1-დან (Row 2), რადგან 0 არის სათაური
      for (let C = 0; C <= 6; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) continue;

        // 1. ჰედერის სტილი (Row 2)
        if (R === 1) {
          worksheet[address].s = headerStyle;
        } 
        // 2. ბოლო რიგის (ჯამების) სტილი
        else if (R === lastRowIndex) {
          worksheet[address].s = summaryStyle;
          // ფულის ფორმატი ბოლო რიგში
          if (C === 4 || C === 6) worksheet[address].s.numFmt = "#,##0.00";
        } 
        // 3. ჩვეულებრივი მონაცემები
        else {
          const colLetter = XLSX.utils.encode_col(C);
          
          if (colLetter === "G") { // Total Value (Column G)
             worksheet[address].s = currencyYellowStyle;
          } else if (colLetter === "E") { // Price (Column E)
             worksheet[address].s = currencyStyle;
          } else if (colLetter === "F") { // Stock (Column F)
             worksheet[address].s = centerStyle;
          } else if (colLetter === "A") { // Name
             worksheet[address].s = leftStyle;
          } else {
             worksheet[address].s = centerStyle;
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    const filename = `Inventory_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return {
        success: true,
        totalStock: grandTotalStock,
        totalValue: grandTotalValue,
        exportedProducts: flattenedData.length - 1 // -1 გამოვაკლოთ Summary Row
    };

  } catch (error) {
    console.error("Inventory export error:", error);
    return { success: false, error: error };
  }
};

// Export turnover report to Excel
export const exportTurnoverToExcel = (
  products: Product[],
  selectedProductIds: Set<string>,
  startDate: Date,
  endDate: Date
) => {
  try {
    // Calculate turnover data
    const turnoverData = calculateTurnover(products, selectedProductIds, startDate, endDate);

    if (turnoverData.length === 0) {
      return { success: false, error: "ამ პერიოდში მონაცემები ვერ მოიძებნა" };
    }

    // Prepare data for Excel
    const flattenedData: any[] = [];

    // Report title and period
    const reportTitle = `სასაწყობო ბრუნვითი უწყისი: ${startDate.toLocaleDateString("ka-GE")} - ${endDate.toLocaleDateString("ka-GE")}`;

    let totalOpeningQuantity = 0;
    let totalQuantityIn = 0;
    let totalQuantityOut = 0;
    let totalDifference = 0;
    let totalClosingQuantity = 0;

    turnoverData.forEach((item) => {
      totalOpeningQuantity += item.openingQuantity;
      totalQuantityIn += item.quantityIn;
      totalQuantityOut += item.quantityOut;
      totalDifference += item.difference;
      totalClosingQuantity += item.closingQuantity;

      flattenedData.push({
        "კოდი": item.productCode,
        "დასახელება": item.productName,
        "ერთეული": item.unit,
        "საწყისი რაოდენობრივი ნაშთი": item.openingQuantity,
        "მიღება": item.quantityIn,
        "გაყიდვა": item.quantityOut,
        "ბრუნვის სხვაობა": item.difference,
        "მარაგის ნაშთი": item.closingQuantity,
      });
    });

    // Add summary row
    flattenedData.push({
      "კოდი": "",
      "დასახელება": "სულ ჯამში:",
      "ერთეული": "",
      "საწყისი რაოდენობრივი ნაშთი": totalOpeningQuantity,
      "მიღება": totalQuantityIn,
      "გაყიდვა": totalQuantityOut,
      "ბრუნვის სხვაობა": totalDifference,
      "მარაგის ნაშთი": totalClosingQuantity,
    });

    // Create Excel workbook
    const worksheet = XLSX.utils.aoa_to_sheet([[reportTitle]]);
    XLSX.utils.sheet_add_json(worksheet, flattenedData, { origin: "A2" });

    const workbook = XLSX.utils.book_new();

    // Merge title cell (A1 to H1)
    if (!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

    // Set column widths
    const colWidths = [
      { wch: 15 }, // A: კოდი
      { wch: 30 }, // B: დასახელება
      { wch: 10 }, // C: ერთეული
      { wch: 18 }, // D: საწყისი რაოდენობრივი ნაშთი
      { wch: 12 }, // E: მიღება
      { wch: 12 }, // F: გაყიდვა
      { wch: 15 }, // G: ბრუნვის სხვაობა
      { wch: 15 }, // H: მარაგის ნაშთი
    ];
    worksheet["!cols"] = colWidths;

    // Styling
    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    // Title style
    const titleStyle = {
      font: { bold: true, sz: 16, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "FFFFFF" } }
    };

    // Header style - Traditional blue style
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: borderStyle,
    };

    // Summary style - Light green for totals
    const summaryStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "D4EDDA" } },
      border: borderStyle,
      alignment: { horizontal: "center" }
    };

    // Quantity style - numbers centered
    const quantityStyle = {
      alignment: { horizontal: "center", vertical: "center" },
      numFmt: "#,##0",
      border: borderStyle
    };

    const centerStyle = {
      alignment: { horizontal: "center", vertical: "center" },
      border: borderStyle
    };

    const leftStyle = {
      alignment: { horizontal: "left", vertical: "center" },
      border: borderStyle
    };

    // Apply title style
    if (!worksheet["A1"].s) worksheet["A1"].s = {};
    worksheet["A1"].s = titleStyle;

    // Set row heights
    if (!worksheet["!rows"]) worksheet["!rows"] = [];
    worksheet["!rows"][0] = { hpx: 30 }; // Title
    worksheet["!rows"][1] = { hpx: 25 }; // Header

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    const lastRowIndex = range.e.r;

    // Apply styles to all cells
    for (let R = 1; R <= lastRowIndex; ++R) {
      for (let C = 0; C <= 7; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) continue;

        if (R === 1) {
          // Header row
          worksheet[address].s = headerStyle;
        } else if (R === lastRowIndex) {
          // Summary row
          worksheet[address].s = summaryStyle;
          if (C >= 3 && C <= 7) worksheet[address].s.numFmt = "#,##0";
        } else {
          // Data rows
          const colLetter = XLSX.utils.encode_col(C);

          if (["D", "E", "F", "G", "H"].includes(colLetter)) { // Quantity columns
            worksheet[address].s = quantityStyle;
          } else if (colLetter === "A") { // Code column
            worksheet[address].s = centerStyle;
          } else if (colLetter === "B") { // Product name
            worksheet[address].s = leftStyle;
          } else if (colLetter === "C") { // Unit column
            worksheet[address].s = centerStyle;
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "ბრუნვითი უწყისი");
    const filename = `ბრუნვითი_უწყისი_${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return {
      success: true,
      totalOpeningQuantity,
      totalQuantityIn,
      totalQuantityOut,
      totalDifference,
      totalClosingQuantity,
      exportedProducts: flattenedData.length - 1 // -1 for summary row
    };

  } catch (error) {
    console.error("Turnover export error:", error);
    return { success: false, error: error };
  }
};