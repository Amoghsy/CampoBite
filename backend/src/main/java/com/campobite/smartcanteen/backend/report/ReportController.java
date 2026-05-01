package com.campobite.smartcanteen.backend.report;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reports")
public class ReportController {

    private final PdfService pdfService;
    private final ExcelService excelService;

    public ReportController(PdfService pdfService, ExcelService excelService) {
        this.pdfService = pdfService;
        this.excelService = excelService;
    }

    @GetMapping("/daily-pdf")
    public void downloadDailyReport(HttpServletResponse response) throws IOException {
        response.setContentType("application/pdf");
        String headerKey = "Content-Disposition";
        String headerValue = "attachment; filename=daily-report-" + LocalDate.now() + ".pdf";
        response.setHeader(headerKey, headerValue);

        this.pdfService.generateDailyReportPdf(response.getOutputStream());
    }

    @GetMapping("/daily-excel")
    public void downloadDailyExcel(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String headerKey = "Content-Disposition";
        String headerValue = "attachment; filename=daily-report-" + LocalDate.now() + ".xlsx";
        response.setHeader(headerKey, headerValue);

        this.excelService.generateDailyReportExcel(response.getOutputStream());
    }
}
