// src/utils/excelExporter.ts
import * as XLSX from "xlsx-js-style";
import type { Order, Product, StockHistory } from "../types";
import { getOrderItemDisplayName } from "./displayHelpers";

// ✅ შესწორებული: იღებს currentStock-ს და აბრუნებს მას, თუ ისტორია არ არის
const getStockAtDate = (
  currentStock: number, 
  stockHistory: StockHistory[] | undefined, 
  targetDate: Date
): number => {
  // 1. თუ ისტორია საერთოდ არ გვაქვს, ვაბრუნებთ იმას, რაც ახლაა
  if (!stockHistory || stockHistory.length === 0) {
    return currentStock;
  }

  // 2. ვფილტრავთ: გვინდა მხოლოდ ის ჩანაწერები, რომლებიც მოხდა "targetDate"-ამდე
  const relevantHistory = stockHistory.filter(entry => {
    const entryDate = entry.timestamp instanceof Date 
      ? entry.timestamp 
      : new Date(entry.timestamp);
    return entryDate.getTime() <= targetDate.getTime();
  });

  // 3. თუ ძველი ჩანაწერი არ არსებობს, მაინც ვაბრუნებთ მიმდინარეს
  if (relevantHistory.length === 0) {
    return currentStock; 
  }

  // 4. ვალაგებთ თარიღის მიხედვით (ახლიდან - ძველისკენ)
  relevantHistory.sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  // 5. ვიღებთ Snapshot-ს
  return relevantHistory[0].quantity;
};

export const exportSingleOrderToExcel = (order: Order) => {
  try {
    const flattenedData: any[] = [];

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

    order.items.forEach((item, index) => {
      const sku = item.product.productCode || "-";
      const productName = getOrderItemDisplayName(item);
      const quantity = item.quantity;
      const unitPrice = item.price;

      flattenedData.push({
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
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, order.orderNumber);

    const colWidths = [
      { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 15 }, { wch: 30 },
      { wch: 12 }, { wch: 15 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
      { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 28 },
    ];
    worksheet["!cols"] = colWidths;

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

    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;
      worksheet[address].s = headerStyle;
    }

    for (let row = 2; row <= flattenedData.length + 1; row++) {
      for (let col = 0; col < 14; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });
        if (!worksheet[cellAddress]) continue;
        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};

        worksheet[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };

        const colLetter = XLSX.utils.encode_col(col);
        if (["F", "G", "H", "I"].includes(colLetter)) {
          worksheet[cellAddress].s.alignment = { horizontal: "right", vertical: "center", wrapText: true };
          if (worksheet[cellAddress].v !== "" && worksheet[cellAddress].v !== undefined) {
            worksheet[cellAddress].s.numFmt = "#,##0.00";
          }
        }
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
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt as any);
      const formattedDate = orderDate.toLocaleDateString("ka-GE");
      const address = `${order.deliveryInfo.city}, ${order.deliveryInfo.address}`;
      const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`.trim();
      const paymentMethodText = order.paymentMethod === "cash" ? "ნაღდი ფული" : order.paymentMethod === "tbc_bank" ? "TBC ბანკი" : "ბარათით";
      const shippingCost = order.deliveryInfo.shippingCost || 0;
      const totalAllItems = order.items.reduce((sum, item) => sum + item.total, 0);
      const orderGrandTotal = totalAllItems + shippingCost;

      order.items.forEach((item, index) => {
        const sku = item.product.productCode || "-";
        const productName = getOrderItemDisplayName(item);
        const quantity = item.quantity;
        const unitPrice = item.price;

        flattenedData.push({
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
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "შეკვეთები");

    const colWidths = [
        { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 15 }, { wch: 30 },
        { wch: 12 }, { wch: 15 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
        { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 28 },
    ];
    worksheet["!cols"] = colWidths;

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

    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;
      worksheet[address].s = headerStyle;
    }

    const yellowFill = { fgColor: { rgb: "FFFF99" } };
    let lastOrderNumber = null;

    for (let row = 2; row <= flattenedData.length + 1; row++) {
      const orderNumberCell = "B" + row;
      const currentOrderNumber = worksheet[orderNumberCell]?.v;
      const isNewOrder = currentOrderNumber !== lastOrderNumber;
      if (isNewOrder) lastOrderNumber = currentOrderNumber;

      for (let col = 0; col < 14; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });
        if (!worksheet[cellAddress]) continue;
        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
        if (col === 1 && isNewOrder) worksheet[cellAddress].s.fill = yellowFill;

        worksheet[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
        const colLetter = XLSX.utils.encode_col(col);
        if (["F", "G", "H", "I"].includes(colLetter)) {
          worksheet[cellAddress].s.alignment = { horizontal: "right", vertical: "center", wrapText: true };
          if (worksheet[cellAddress].v !== "" && worksheet[cellAddress].v !== undefined) {
             worksheet[cellAddress].s.numFmt = "#,##0.00";
          }
        }
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

    const filename = `შეკვეთები_ექსპორტი_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    return true;
  } catch (error) {
    console.error("Excel export error:", error);
    return false;
  }
};

// ✅ განახლებული ინვენტარის ექსპორტი
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
      // ვარიანტებიანი პროდუქტი
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
           // ✅ ვიყენებთ adjustedEndDate-ს და ვაწვდით currentStock-ს
           const stock = dateRange && adjustedEndDate
             ? getStockAtDate(variant.stock || 0, variant.stockHistory, adjustedEndDate) 
             : (variant.stock || 0);
             
           const price = variant.price || 0;
           const totalValue = stock * price;

           grandTotalStock += stock;
           grandTotalValue += totalValue;

           flattenedData.push({
             "პროდუქტის დასახელება": product.name,
             "კოდი (SKU)": product.productCode || "-",
             "კატეგორია": product.category || "-",
             "ვარიანტი": variant.name,
             "ერთეულის ფასი (₾)": price,
             "მარაგი (ცალი)": stock,
             "ჯამური ღირებულება (₾)": totalValue,
           });
        });
      } else {
        // მარტივი პროდუქტი
        // ✅ ვიყენებთ adjustedEndDate-ს და ვაწვდით currentStock-ს
        const stock = dateRange && adjustedEndDate
           ? getStockAtDate(product.stock || 0, product.stockHistory, adjustedEndDate) 
           : (product.stock || 0);

        const price = product.price || 0;
        const totalValue = stock * price;

        grandTotalStock += stock;
        grandTotalValue += totalValue;

        flattenedData.push({
          "პროდუქტის დასახელება": product.name,
          "კოდი (SKU)": product.productCode || "-",
          "კატეგორია": product.category || "-",
          "ვარიანტი": "-",
          "ერთეულის ფასი (₾)": price,
          "მარაგი (ცალი)": stock,
          "ჯამური ღირებულება (₾)": totalValue,
        });
      }
    });

    // 4. ჯამური სტრიქონის დამატება
    flattenedData.push({
      "პროდუქტის დასახელება": "სულ ჯამში:",
      "კოდი (SKU)": "",
      "კატეგორია": "",
      "ვარიანტი": "",
      "ერთეულის ფასი (₾)": "",
      "მარაგი (ცალი)": grandTotalStock,
      "ჯამური ღირებულება (₾)": grandTotalValue,
    });

    // 5. ექსელის აწყობა
    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.sheet_add_aoa(worksheet, [[reportTitle]], { origin: "A1" });

    if(!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });

    const colWidths = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
    ];
    worksheet["!cols"] = colWidths;

    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    const titleStyle = {
      font: { bold: true, sz: 14, color: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "FFFFFF" } }
    };

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "4472C4" } }, 
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: borderStyle,
    };

    const summaryStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E2EFDA" } },
      border: borderStyle,
      alignment: { horizontal: "right" }
    };

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

    if(!worksheet["A1"].s) worksheet["A1"].s = {};
    worksheet["A1"].s = titleStyle;
    if(!worksheet["!rows"]) worksheet["!rows"] = [];
    worksheet["!rows"][0] = { hpx: 30 };
    worksheet["!rows"][1] = { hpx: 25 };

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    const lastRowIndex = range.e.r;

    for (let R = 1; R <= lastRowIndex; ++R) {
      for (let C = 0; C <= 6; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) continue;

        if (R === 1) {
          worksheet[address].s = headerStyle;
        } else if (R === lastRowIndex) {
          worksheet[address].s = summaryStyle;
          if (C === 4 || C === 6) worksheet[address].s.numFmt = "#,##0.00";
        } else {
          const colLetter = XLSX.utils.encode_col(C);
          if (colLetter === "G") worksheet[address].s = currencyYellowStyle;
          else if (colLetter === "E") worksheet[address].s = currencyStyle;
          else if (colLetter === "F") worksheet[address].s = centerStyle;
          else if (colLetter === "A") worksheet[address].s = leftStyle;
          else worksheet[address].s = centerStyle;
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
        exportedProducts: flattenedData.length - 1 
    };

  } catch (error) {
    console.error("Inventory export error:", error);
    return { success: false, error: error };
  }
};