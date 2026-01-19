import * as XLSX from "xlsx-js-style";
import type { Order } from "../types";
import { getOrderItemDisplayName } from "./displayHelpers";

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