package com.campobite.smartcanteen.backend.report;

import com.campobite.smartcanteen.backend.menu.MenuItem;
import com.campobite.smartcanteen.backend.order.OrderItemRepository;
import com.campobite.smartcanteen.backend.order.OrderRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PdfService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;

    public PdfService(OrderRepository orderRepo, OrderItemRepository orderItemRepo) {
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
    }

    public void generateDailyReportPdf(java.io.OutputStream outputStream) throws IOException {
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);
        try {
            PdfWriter.getInstance(document, outputStream);
            document.open();

            // Colors
            Color primaryColor = new Color(0, 102, 204); // Example blue, comparable to brand
            Color lightGray = new Color(240, 240, 240);

            // 1. Header Section
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 1, 1 });

            // Title
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, primaryColor);
            PdfPCell titleCell = new PdfPCell(new Phrase("CampoBite", brandFont));
            titleCell.setBorder(Rectangle.NO_BORDER);
            titleCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            headerTable.addCell(titleCell);

            // Date & Metadata
            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            PdfPCell dateCell = new PdfPCell(new Phrase(
                    "Daily Report\n" + LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy")),
                    metaFont));
            dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            dateCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            dateCell.setBorder(Rectangle.NO_BORDER);
            headerTable.addCell(dateCell);

            headerTable.setSpacingAfter(20f);
            document.add(headerTable);

            // Divider Line
            java.awt.geom.Line2D.Float line = new java.awt.geom.Line2D.Float(36, 0, PageSize.A4.getWidth() - 36, 0);
            // iText 2.1.7 lowagie doesn't verify graphics2d easily here, using simpler line
            // separator
            com.lowagie.text.pdf.draw.LineSeparator ls = new com.lowagie.text.pdf.draw.LineSeparator();
            ls.setLineColor(Color.LIGHT_GRAY);
            document.add(new Chunk(ls));
            document.add(new Paragraph("\n"));

            // 2. Fetch Data
            LocalDateTime start = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
            LocalDateTime end = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

            List<com.campobite.smartcanteen.backend.order.Order> allOrders = orderRepo.findByCreatedAtBetween(start,
                    end);
            Long revenueCents = orderRepo.sumTotalAmountByStatusAndCompletedAtBetween("COMPLETED", start, end);
            double totalRevenue = (revenueCents != null) ? revenueCents : 0.0;

            // 3. Summary Section
            Paragraph summaryTitle = new Paragraph("Performance Summary",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK));
            summaryTitle.setSpacingAfter(10f);
            document.add(summaryTitle);

            PdfPTable summaryTable = new PdfPTable(4);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(25f);

            // Total Orders
            addStatCard(summaryTable, "Total Orders", String.valueOf(allOrders.size()), lightGray);

            // Revenue
            addStatCard(summaryTable, "Total Revenue", "Rs. " + totalRevenue, lightGray);

            // Status Breakdown
            Map<String, Long> statusCounts = allOrders.stream()
                    .collect(Collectors.groupingBy(com.campobite.smartcanteen.backend.order.Order::getStatus,
                            Collectors.counting()));

            addStatCard(summaryTable, "Completed", String.valueOf(statusCounts.getOrDefault("COMPLETED", 0L)),
                    lightGray);
            addStatCard(summaryTable, "Cancelled", String.valueOf(statusCounts.getOrDefault("CANCELLED", 0L)),
                    lightGray);

            document.add(summaryTable);

            // 4. Top Selling Items
            Paragraph topItemsTitle = new Paragraph("Top Selling Items",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK));
            topItemsTitle.setSpacingAfter(10f);
            document.add(topItemsTitle);

            PdfPTable itemTable = new PdfPTable(2);
            itemTable.setWidthPercentage(100);
            itemTable.setWidths(new float[] { 3, 1 });
            itemTable.setHeaderRows(1);

            // Table Header
            addHeaderCell(itemTable, "Item Name");
            addHeaderCell(itemTable, "Quantity Sold");

            List<Object[]> topItems = orderItemRepo.findTopSellingItems(PageRequest.of(0, 5));
            if (topItems.isEmpty()) {
                addCell(itemTable, "No sales recorded today.", false);
                addCell(itemTable, "-", false);
            } else {
                boolean alternate = false;
                for (Object[] row : topItems) {
                    MenuItem item = (MenuItem) row[0];
                    Long sold = (Long) row[1];
                    addCell(itemTable, item.getName(), alternate);
                    addCell(itemTable, String.valueOf(sold), alternate);
                    alternate = !alternate;
                }
            }
            document.add(itemTable);

            // Footer
            Paragraph footer = new Paragraph("\nGenerated by CampoBite Admin System",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(30);
            document.add(footer);

        } catch (DocumentException e) {
            throw new IOException("Error creating PDF", e);
        } finally {
            document.close();
        }
    }

    private void addStatCard(PdfPTable table, String label, String value, Color bgColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(Color.WHITE);
        cell.setBorderWidth(1f);
        cell.setBorderColor(new Color(230, 230, 230));
        cell.setPadding(10f);

        Paragraph pLabel = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY));
        Paragraph pValue = new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK));

        cell.addElement(pLabel);
        cell.addElement(pValue);
        table.addCell(cell);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(
                new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE)));
        cell.setBackgroundColor(new Color(60, 60, 60)); // Dark header
        cell.setPadding(8f);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text, boolean alternate) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        cell.setPadding(8f);
        cell.setBackgroundColor(alternate ? new Color(245, 245, 245) : Color.WHITE);
        cell.setBorderColor(new Color(230, 230, 230));
        table.addCell(cell);
    }
}
