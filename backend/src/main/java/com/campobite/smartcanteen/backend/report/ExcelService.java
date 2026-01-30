package com.campobite.smartcanteen.backend.report;

import com.campobite.smartcanteen.backend.order.Order;
import com.campobite.smartcanteen.backend.order.OrderRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelService {

    private final OrderRepository orderRepository;

    public ExcelService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void generateDailyReportExcel(OutputStream outputStream) throws IOException {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);

        List<Order> dailyOrders = orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Daily Sales");

            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Order ID", "Token", "Customer", "Items", "Amount", "Status", "Time" };
            CellStyle headerStyle = createHeaderStyle(workbook);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Create Currency Style
            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("₹ #,##0.00")); // Indian Rupee format

            // Data Rows
            int rowNum = 1;
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

            for (Order order : dailyOrders) {
                Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(order.getId());
                row.createCell(1).setCellValue(order.getTokenNumber());
                row.createCell(2).setCellValue(order.getUser() != null ? order.getUser().getName() : "Guest");
                row.createCell(3).setCellValue(order.getItemNames() != null ? order.getItemNames() : "-");

                Cell amountCell = row.createCell(4);
                amountCell.setCellValue(order.getTotalAmount());
                amountCell.setCellStyle(currencyStyle);

                row.createCell(5).setCellValue(order.getStatus());
                row.createCell(6).setCellValue(order.getCreatedAt().format(timeFormatter));
            }

            // Styling Extras
            sheet.createFreezePane(0, 1); // Freeze top row
            sheet.setAutoFilter(
                    new org.apache.poi.ss.util.CellRangeAddress(0, Math.max(rowNum, 1), 0, headers.length - 1));

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);

        style.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex()); // Professional dark color
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
}
