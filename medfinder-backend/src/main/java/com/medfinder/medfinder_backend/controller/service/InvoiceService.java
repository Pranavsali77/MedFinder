package com.medfinder.medfinder_backend.controller.service;

import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.*;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.medfinder.medfinder_backend.model.*;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.format.DateTimeFormatter;

@Service
public class InvoiceService {

    public String generateInvoice(Payment payment) throws Exception {

        String folderPath = "invoices";
        File folder = new File(folderPath);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String fileName = "invoice_" + payment.getId() + ".pdf";
        String fullPath = folderPath + "/" + fileName;

        PdfWriter writer = new PdfWriter(fullPath);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        document.setMargins(36, 36, 36, 36);

        Order order = payment.getOrder();
        Pharmacy pharmacy = order.getInventory() != null ? order.getInventory().getPharmacy() : null;
        Medicine medicine = order.getInventory() != null ? order.getInventory().getMedicine() : null;

        String pharmacyName = pharmacy != null ? pharmacy.getName() : "MedFinder Pharmacy";
        String pharmacyAddress = pharmacy != null ? (pharmacy.getAddress() + ", " + pharmacy.getCity()) : "Verified Store Location";
        String pharmacyPhone = pharmacy != null ? pharmacy.getPhone() : "+91 99999 99999";
        String pharmacyEmail = pharmacy != null ? pharmacy.getEmail() : "support@medfinder.com";

        // Brand colors
        DeviceRgb tealColor = new DeviceRgb(0, 150, 136);
        DeviceRgb textDark = new DeviceRgb(33, 33, 33);
        DeviceRgb textLight = new DeviceRgb(117, 117, 117);

        // ------------------ HEADER SECTION ------------------
        Table headerTable = new Table(new float[]{3f, 2f});
        headerTable.setWidth(UnitValue.createPercentValue(100));

        // Left Cell (Pharmacy Info)
        Cell phCell = new Cell();
        phCell.add(new Paragraph(pharmacyName)
                .setBold()
                .setFontSize(22)
                .setFontColor(tealColor)
                .setMarginBottom(4));
        phCell.add(new Paragraph(pharmacyAddress)
                .setFontSize(9)
                .setFontColor(textLight)
                .setMarginBottom(2));
        phCell.add(new Paragraph("Phone: " + pharmacyPhone)
                .setFontSize(9)
                .setFontColor(textLight)
                .setMarginBottom(2));
        phCell.add(new Paragraph("Email: " + pharmacyEmail)
                .setFontSize(9)
                .setFontColor(textLight));
        phCell.setBorder(Border.NO_BORDER);
        headerTable.addCell(phCell);

        // Right Cell (Invoice Meta)
        Cell metaCell = new Cell();
        metaCell.setTextAlignment(TextAlignment.RIGHT);
        metaCell.add(new Paragraph("INVOICE")
                .setBold()
                .setFontSize(26)
                .setFontColor(tealColor)
                .setMarginBottom(10));
        metaCell.add(new Paragraph("Invoice ID: #" + payment.getId())
                .setFontSize(10)
                .setBold()
                .setFontColor(textDark)
                .setMarginBottom(2));
        metaCell.add(new Paragraph("Date: " + order.getOrderDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")))
                .setFontSize(9)
                .setFontColor(textLight)
                .setMarginBottom(2));
        metaCell.add(new Paragraph("Time: " + order.getOrderDate().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
                .setFontSize(9)
                .setFontColor(textLight));
        metaCell.setBorder(Border.NO_BORDER);
        headerTable.addCell(metaCell);

        document.add(headerTable);
        document.add(new Paragraph("\n"));

        // Horizontal Line Separator
        SolidLine line = new SolidLine(1f);
        line.setColor(tealColor);
        LineSeparator ls = new LineSeparator(line);
        document.add(ls);
        document.add(new Paragraph("\n"));

        // ------------------ BILLING & PAYMENT INFO ------------------
        Table infoTable = new Table(new float[]{1f, 1f});
        infoTable.setWidth(UnitValue.createPercentValue(100));

        // Customer Info
        Cell customerCell = new Cell();
        customerCell.add(new Paragraph("BILLED TO")
                .setBold()
                .setFontSize(10)
                .setFontColor(tealColor)
                .setMarginBottom(6));
        customerCell.add(new Paragraph(order.getUser().getName())
                .setBold()
                .setFontSize(11)
                .setFontColor(textDark)
                .setMarginBottom(2));
        customerCell.add(new Paragraph(order.getUser().getEmail())
                .setFontSize(9)
                .setFontColor(textLight)
                .setMarginBottom(2));
        customerCell.add(new Paragraph("Delivery/Pickup Address:\n" + order.getDeliveryAddress())
                .setFontSize(9)
                .setFontColor(textLight));
        customerCell.setBorder(Border.NO_BORDER);
        infoTable.addCell(customerCell);

        // Payment Info
        Cell paymentCell = new Cell();
        paymentCell.add(new Paragraph("PAYMENT DETAILS")
                .setBold()
                .setFontSize(10)
                .setFontColor(tealColor)
                .setMarginBottom(6));
        paymentCell.add(new Paragraph("Method: " + payment.getMethod().name())
                .setFontSize(10)
                .setBold()
                .setFontColor(textDark)
                .setMarginBottom(2));
        paymentCell.add(new Paragraph("Status: SUCCESS")
                .setFontSize(10)
                .setBold()
                .setFontColor(new DeviceRgb(76, 175, 80)) // Green
                .setMarginBottom(2));
        paymentCell.add(new Paragraph("Transaction ID:\n" + (payment.getTransactionId() != null ? payment.getTransactionId() : "N/A"))
                .setFontSize(9)
                .setFontColor(textLight));
        paymentCell.setBorder(Border.NO_BORDER);
        infoTable.addCell(paymentCell);

        document.add(infoTable);
        document.add(new Paragraph("\n\n"));

        // ------------------ ITEMS TABLE ------------------
        Table itemsTable = new Table(new float[]{4f, 1f, 1.5f, 1.5f});
        itemsTable.setWidth(UnitValue.createPercentValue(100));

        // Table Header
        String[] headers = {"Medication Description", "Qty", "Unit Price", "Total"};
        for (String h : headers) {
            Cell headCell = new Cell();
            headCell.add(new Paragraph(h).setBold().setFontColor(ColorConstants.WHITE).setFontSize(10));
            headCell.setBackgroundColor(tealColor);
            headCell.setPadding(8);
            headCell.setBorder(new SolidBorder(ColorConstants.WHITE, 0.5f));
            if (!h.equals("Medication Description")) {
                headCell.setTextAlignment(TextAlignment.RIGHT);
            }
            itemsTable.addCell(headCell);
        }

        // Data Row
        String medName = medicine != null ? medicine.getName() : "Prescribed Medicine";
        double unitPrice = order.getInventory() != null ? order.getInventory().getPrice() : 0.0;
        int qty = order.getQuantity();
        double total = payment.getAmount();

        Cell medCell = new Cell();
        medCell.add(new Paragraph(medName).setBold().setFontSize(10).setFontColor(textDark));
        medCell.setPadding(10);
        medCell.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
        itemsTable.addCell(medCell);

        Cell qtyCell = new Cell();
        qtyCell.add(new Paragraph(String.valueOf(qty)).setFontSize(10).setFontColor(textDark));
        qtyCell.setTextAlignment(TextAlignment.RIGHT);
        qtyCell.setPadding(10);
        qtyCell.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
        itemsTable.addCell(qtyCell);

        Cell priceCell = new Cell();
        priceCell.add(new Paragraph("₹" + String.format("%.2f", unitPrice)).setFontSize(10).setFontColor(textDark));
        priceCell.setTextAlignment(TextAlignment.RIGHT);
        priceCell.setPadding(10);
        priceCell.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
        itemsTable.addCell(priceCell);

        Cell totalCell = new Cell();
        totalCell.add(new Paragraph("₹" + String.format("%.2f", total)).setBold().setFontSize(10).setFontColor(textDark));
        totalCell.setTextAlignment(TextAlignment.RIGHT);
        totalCell.setPadding(10);
        totalCell.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
        itemsTable.addCell(totalCell);

        document.add(itemsTable);
        document.add(new Paragraph("\n"));

        // ------------------ TOTAL SUMMARY ------------------
        Table summaryTable = new Table(new float[]{1f});
        summaryTable.setWidth(150);
        summaryTable.setHorizontalAlignment(HorizontalAlignment.RIGHT);

        Cell sCell = new Cell();
        sCell.add(new Paragraph("Total Amount Paid:")
                .setFontSize(8)
                .setFontColor(textLight)
                .setTextAlignment(TextAlignment.RIGHT));
        sCell.add(new Paragraph("₹" + String.format("%.2f", total))
                .setBold()
                .setFontSize(16)
                .setFontColor(tealColor)
                .setTextAlignment(TextAlignment.RIGHT));
        sCell.setPadding(10);
        sCell.setBackgroundColor(new DeviceRgb(245, 245, 245));
        sCell.setBorder(new SolidBorder(tealColor, 1f));
        summaryTable.addCell(sCell);

        document.add(summaryTable);
        document.add(new Paragraph("\n\n\n"));

        // ------------------ FOOTER NOTICE ------------------
        Paragraph footerNotice = new Paragraph("Thank you for using MedFinder to secure your medications!\nIf you have any questions about your prescription, please contact the pharmacy directly.")
                .setFontSize(8)
                .setFontColor(textLight)
                .setTextAlignment(TextAlignment.CENTER)
                .setItalic();
        document.add(footerNotice);

        document.close();

        return fullPath;
    }
}