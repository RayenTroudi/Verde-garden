import jsPDF from "jspdf";

interface OrderItem {
  name: { fr: string; en: string };
  price: number;
  quantity: number;
}

interface OrderPDFData {
  orderNumber: string;
  createdAt: string;
  shipping: {
    fullName: string;
    phone: string;
    email: string;
    country: string;
    city: string;
    streetAddress: string;
    state?: string;
    zipCode: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingStatus: string;
}

export function downloadOrderPDF(order: OrderPDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 16;
  let y = 20;

  const green = [74, 103, 65] as [number, number, number];
  const darkGreen = [45, 74, 45] as [number, number, number];
  const slate = [100, 116, 139] as [number, number, number];
  const slateLight = [226, 232, 240] as [number, number, number];

  // Header bar
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("VERDE GARDEN", margin, 10.5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Order Invoice", W - margin, 10.5, { align: "right" });

  y = 26;

  // Order number + date
  doc.setTextColor(...darkGreen);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Order #${order.orderNumber}`, margin, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slate);
  doc.text(
    `Placed on ${new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    margin,
    y + 6
  );

  y += 16;

  // Two-column info section
  const col2x = W / 2 + 4;

  // Customer info
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...slate);
  doc.text("CUSTOMER", margin, y);
  doc.text("DELIVERY ADDRESS", col2x, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);

  const customerLines = [
    order.shipping.fullName,
    order.shipping.email,
    order.shipping.phone,
  ];
  customerLines.forEach((line, i) => doc.text(line, margin, y + i * 5));

  const addressLines = [
    order.shipping.streetAddress,
    `${order.shipping.city}${order.shipping.state ? ", " + order.shipping.state : ""}, ${order.shipping.zipCode}`,
    order.shipping.country,
  ];
  addressLines.forEach((line, i) => doc.text(line, col2x, y + i * 5));

  if (order.shipping.notes) {
    const noteY = y + customerLines.length * 5 + 2;
    doc.setFontSize(7);
    doc.setTextColor(...slate);
    doc.text("Note:", margin, noteY);
    doc.setTextColor(71, 85, 105);
    doc.text(order.shipping.notes, margin + 8, noteY);
    y = noteY + 6;
  } else {
    y += Math.max(customerLines.length, addressLines.length) * 5 + 4;
  }

  // Divider
  doc.setDrawColor(...slateLight);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // Items table header
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y - 3, W - margin * 2, 8, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...slate);
  doc.text("ITEM", margin + 2, y + 2);
  doc.text("QTY", W - 60, y + 2);
  doc.text("UNIT PRICE", W - 45, y + 2);
  doc.text("TOTAL", W - margin - 2, y + 2, { align: "right" });
  y += 8;

  // Items rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  order.items.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 252, 250);
      doc.rect(margin, y - 3, W - margin * 2, 7, "F");
    }
    doc.setTextColor(30, 41, 59);
    doc.text(item.name.en, margin + 2, y + 2);
    doc.text(String(item.quantity), W - 60, y + 2);
    doc.text(`${item.price.toFixed(2)} TND`, W - 45, y + 2);
    doc.text(`${(item.price * item.quantity).toFixed(2)} TND`, W - margin - 2, y + 2, { align: "right" });
    y += 7;
  });

  y += 4;
  doc.setDrawColor(...slateLight);
  doc.line(margin, y, W - margin, y);
  y += 5;

  // Totals
  const totalsX = W - margin - 50;
  const valX = W - margin - 2;

  doc.setFontSize(9);
  doc.setTextColor(...slate);
  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(30, 41, 59);
  doc.text(`${order.subtotal.toFixed(2)} TND`, valX, y, { align: "right" });
  y += 6;

  doc.setTextColor(...slate);
  doc.text("Shipping", totalsX, y);
  doc.setTextColor(30, 41, 59);
  doc.text(order.shippingCost === 0 ? "Free" : `${order.shippingCost.toFixed(2)} TND`, valX, y, { align: "right" });
  y += 6;

  doc.setDrawColor(...slateLight);
  doc.line(totalsX, y, W - margin, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...darkGreen);
  doc.text("Total", totalsX, y);
  doc.text(`${order.total.toFixed(2)} TND`, valX, y, { align: "right" });

  y += 10;

  // Payment + shipping status pills
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slate);
  doc.text(`Payment: ${order.paymentStatus.replace(/_/g, " ")}   ·   Delivery: ${order.shippingStatus.replace(/_/g, " ")}`, margin, y);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(...slate);
  doc.text("Verde Garden · verdegarden.tn", W / 2, 288, { align: "center" });

  doc.save(`order-${order.orderNumber}.pdf`);
}
