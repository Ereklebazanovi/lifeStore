//excelExporter.ts
import * as XLSX from "xlsx-js-style";
import type { Order, Product, ProductVariant, StockHistory } from "../types";
import { getOrderItemDisplayName } from "./displayHelpers";

const getStockAtDate = (stockHistory: StockHistory[] | undefined, targetDate: Date): number => {
  if (!stockHistory || stockHistory.length === 0) return 0;
  const relevantHistory = stockHistory.filter(h => new Date(h.timestamp) <= targetDate);
  if (relevantHistory.length === 0) return 0;
  relevantHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

    // Auto-fit columns
    const colWidths = [
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

    // Apply data row styling - all rows same color for single order
    for (let row = 2; row <= flattenedData.length + 1; row++) {
      for (let col = 0; col < 14; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });
        if (!worksheet[cellAddress]) continue;
        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};

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
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "შეკვეთები");

    const colWidths = [
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

    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;
      worksheet[address].s = headerStyle;
    }

    // Highlight order number column when order changes
    const yellowFill = { fgColor: { rgb: "FFFF99" } }; // ყვითალი
    let lastOrderNumber = null;

    for (let row = 2; row <= flattenedData.length + 1; row++) {
      const orderNumberCell = "B" + row;
      const currentOrderNumber = worksheet[orderNumberCell]?.v;
      const isNewOrder = currentOrderNumber !== lastOrderNumber;

      if (isNewOrder) {
        lastOrderNumber = currentOrderNumber;
      }

      // ვასტილავთ მთელ რიგს
      for (let col = 0; col < 14; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });
        if (!worksheet[cellAddress]) continue;
        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};

        // ყვითალი ფერი მხოლოდ სვეტი B-ში (შეკვეთის ნომერი) როდესაც იწყება ახალი შეკვეთა
        if (col === 1 && isNewOrder) { // col 1 = column B
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
           const stock = dateRange ? getStockAtDate(variant.stockHistory, dateRange.endDate) : (variant.stock || 0);
           const price = variant.price || 0;
           const totalValue = stock * price;

           grandTotalStock += stock;
           grandTotalValue += totalValue;

           flattenedData.push({
             "პროდუქტის დასახელება": product.name,
             "პროდუქტის კოდი": product.productCode || "-",
             "კატეგორია": product.category || "-",
             "ვარიანტი": variant.name,
             "ერთეულის ფასი (₾)": price,
             "მარაგი (ცალი)": stock,
             "ჯამური ღირებულება (₾)": totalValue,
           });
        });
      } else {
        // მარტივი პროდუქტი
        const stock = dateRange ? getStockAtDate(product.stockHistory, dateRange.endDate) : (product.stock || 0);
        const price = product.price || 0;
        const totalValue = stock * price;

        grandTotalStock += stock;
        grandTotalValue += totalValue;

        flattenedData.push({
          "პროდუქტის დასახელება": product.name,
          "პროდუქტის კოდი": product.productCode || "-",
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
      "პროდუქტის კოდი": "",
      "კატეგორია": "",
      "ვარიანტი": "",
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

    // A1 უჯრის გაერთიანება (Merge) მთელ სიგანეზე (A-დან G-მდე)
    if(!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }); // Row 0, Col 0 to Col 6

    // 6. სვეტების სიგანეები
    const colWidths = [
      { wch: 30 }, // A: სახელი
      { wch: 15 }, // B: SKU
      { wch: 15 }, // C: კატეგორია
      { wch: 15 }, // D: ვარიანტი
      { wch: 15 }, // E: ფასი
      { wch: 15 }, // F: მარაგი
      { wch: 20 }, // G: ჯამი
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