import * as XLSX from "xlsx";
import type { Order } from "../types";
import { getOrderItemDisplayName } from "./displayHelpers";

// Helper function to apply styles to the worksheet
const applyAccountantStyles = (worksheet: XLSX.WorkSheet, rowCount: number) => {
  // 1. Define Column Widths (Wider for readability)
  const colWidths = [
    { wch: 15 }, // A: Date
    { wch: 20 }, // B: Order No
    { wch: 15 }, // C: Status
    { wch: 15 }, // D: SKU
    { wch: 40 }, // E: Product Name (Much wider)
    { wch: 10 }, // F: Qty
    { wch: 15 }, // G: Unit Price
    { wch: 15 }, // H: Shipping
    { wch: 15 }, // I: Total
    { wch: 20 }, // J: Payment Method
    { wch: 25 }, // K: Customer Name
    { wch: 15 }, // L: Phone
    { wch: 50 }, // M: Address (Much wider)
    { wch: 30 }, // N: Comment
  ];
  worksheet["!cols"] = colWidths;

  // 2. Define Styles
  const borderStyle = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
    fill: { fgColor: { rgb: "1F4E78" } }, // Dark Blue
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderStyle,
  };

  const textLeftStyle = {
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: borderStyle,
  };

  const textCenterStyle = {
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderStyle,
  };

  const currencyStyle = {
    alignment: { horizontal: "right", vertical: "center", wrapText: true },
    numFmt: "#,##0.00", // Standard Accounting Format
    border: borderStyle,
  };

  const totalCurrencyStyle = {
    alignment: { horizontal: "right", vertical: "center", wrapText: true },
    numFmt: "#,##0.00",
    fill: { fgColor: { rgb: "FFF2CC" } }, // Light Yellow for totals
    font: { bold: true },
    border: borderStyle,
  };

  // 3. Apply Header Styles (Row 1)
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!worksheet[address]) continue;
    worksheet[address].s = headerStyle;
  }

  // 4. Apply Data Styles (Row 2 onwards)
  // Columns Mapping for styling logic:
  // Text Left: Product Name (E), Customer (K), Address (M), Comment (N)
  // Numbers Right: Price (G), Shipping (H), Total (I)
  // Others Center: Date, ID, Status, SKU, Qty, Phone, Payment
  
  for (let R = 1; R <= rowCount; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[address]) continue;

      const colLetter = XLSX.utils.encode_col(C);
      
      // Determine style based on column
      if (["E", "K", "M", "N"].includes(colLetter)) {
        worksheet[address].s = textLeftStyle;
      } else if (["G", "H"].includes(colLetter)) {
        worksheet[address].s = currencyStyle;
      } else if (["I"].includes(colLetter)) {
        worksheet[address].s = totalCurrencyStyle;
      } else {
        worksheet[address].s = textCenterStyle;
      }
    }
  }

  // 5. Set Header Row Height
  worksheet["!rows"] = [{ hpx: 30 }]; // Taller header
  
  // 6. Freeze Header Row
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
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

    order.items.forEach((item) => {
      const sku = item.product.productCode || "-";
      const productName = getOrderItemDisplayName(item);
      const quantity = item.quantity;
      const unitPrice = item.price;
      const totalPrice = item.total;
      const shippingCost = order.deliveryInfo.shippingCost || 0;

      flattenedData.push({
        "თარიღი": formattedDate,
        "შეკვეთის ნომერი": order.orderNumber,
        "სტატუსი": order.orderStatus,
        "პროდუქტის კოდი": sku,
        "პროდუქტის დასახელება": productName,
        "რაოდენობა": quantity,
        "ერთეულის ფასი": unitPrice,
        "საკურიერო თანხა": shippingCost,
        "სულ თანხა": totalPrice,
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

    // Apply the clean accountant styles
    applyAccountantStyles(worksheet, flattenedData.length);

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

      order.items.forEach((item) => {
        const sku = item.product.productCode || "-";
        const productName = getOrderItemDisplayName(item);
        const quantity = item.quantity;
        const unitPrice = item.price;
        const totalPrice = item.total;
        const shippingCost = order.deliveryInfo.shippingCost || 0;

        flattenedData.push({
          "თარიღი": formattedDate,
          "შეკვეთის ნომერი": order.orderNumber,
          "სტატუსი": order.orderStatus,
          "პროდუქტის კოდი": sku,
          "პროდუქტის დასახელება": productName,
          "რაოდენობა": quantity,
          "ერთეულის ფასი": unitPrice,
          "საკურიერო თანხა": shippingCost,
          "სულ თანხა": totalPrice,
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

    // Apply the clean accountant styles
    applyAccountantStyles(worksheet, flattenedData.length);

    const filename = `შეკვეთები_ექსპორტი_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return true;
  } catch (error) {
    console.error("Excel export error:", error);
    return false;
  }
};