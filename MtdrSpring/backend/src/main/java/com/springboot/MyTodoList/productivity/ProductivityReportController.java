package com.springboot.MyTodoList.productivity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/productivity-report")
public class ProductivityReportController {
    private final ProductivityReportService productivityReportService;

    public ProductivityReportController(ProductivityReportService productivityReportService) {
        this.productivityReportService = productivityReportService;
    }

    @GetMapping
    public ProductivityReport getReport(@RequestParam(value = "sprintId", defaultValue = "all") String sprintId) {
        return productivityReportService.buildReport(sprintId);
    }
}
