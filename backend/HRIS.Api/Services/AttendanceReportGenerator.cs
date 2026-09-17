using ClosedXML.Excel;
using HRIS.Api.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace HRIS.Api.Services;

public static class AttendanceReportGenerator
{
    public static byte[] GeneratePdf(AttendanceMonitoringResponse data, DateOnly rangeStart, DateOnly rangeEnd)
    {
        var employeeGroups = data.Records
            .GroupBy(r => (r.EmployeeId, r.EmployeeName))
            .OrderBy(g => g.Key.EmployeeName)
            .ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text("Attendance Report").FontSize(18).Bold();
                    col.Item().Text($"Period: {rangeStart:yyyy-MM-dd} to {rangeEnd:yyyy-MM-dd}");
                    col.Item().Text($"Generated: {PhilippineTime.Now:yyyy-MM-dd HH:mm} (PHT)").FontSize(9).FontColor(Colors.Grey.Medium);
                });

                page.Content().PaddingVertical(10).Column(column =>
                {
                    column.Spacing(14);

                    if (employeeGroups.Count == 0)
                    {
                        column.Item().Text("No attendance records for the selected period.");
                    }

                    foreach (var group in employeeGroups)
                    {
                        column.Item().Column(empCol =>
                        {
                            empCol.Item().Text(group.Key.EmployeeName).FontSize(13).Bold();

                            var weeks = group
                                .GroupBy(r => AttendanceCalculator.GetWeekStart(r.Date))
                                .OrderBy(w => w.Key);

                            foreach (var week in weeks)
                            {
                                var weekEnd = AttendanceCalculator.GetWeekEnd(week.Key);
                                var total = data.WeeklySummaries
                                    .FirstOrDefault(s => s.EmployeeId == group.Key.EmployeeId && s.WeekStart == week.Key)
                                    ?.TotalHours ?? 0;

                                empCol.Item().PaddingTop(6).Text($"Week: {week.Key:yyyy-MM-dd} to {weekEnd:yyyy-MM-dd}").FontSize(11).Bold();

                                empCol.Item().Table(table =>
                                {
                                    table.ColumnsDefinition(columns =>
                                    {
                                        columns.RelativeColumn(2);
                                        columns.RelativeColumn(2);
                                        columns.RelativeColumn(2);
                                        columns.RelativeColumn(2);
                                    });

                                    table.Header(header =>
                                    {
                                        header.Cell().Element(HeaderCell).Text("Date");
                                        header.Cell().Element(HeaderCell).Text("Time In");
                                        header.Cell().Element(HeaderCell).Text("Time Out");
                                        header.Cell().Element(HeaderCell).Text("Daily Hours");
                                    });

                                    foreach (var record in week.OrderBy(r => r.Date))
                                    {
                                        table.Cell().Element(BodyCell).Text(record.Date.ToString("yyyy-MM-dd"));
                                        table.Cell().Element(BodyCell).Text(record.TimeIn?.ToString("hh:mm tt") ?? "-");
                                        table.Cell().Element(BodyCell).Text(record.TimeOut?.ToString("hh:mm tt") ?? "-");
                                        table.Cell().Element(BodyCell).Text(record.DailyHours?.ToString("0.00") ?? "In progress");
                                    }
                                });

                                empCol.Item().AlignRight().Text($"Week Total: {total:0.00} hrs").FontSize(10).Bold();
                            }
                        });
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private static IContainer HeaderCell(IContainer container) =>
        container.Background(Colors.Grey.Lighten3).Padding(4).DefaultTextStyle(x => x.Bold());

    private static IContainer BodyCell(IContainer container) =>
        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4);

    public static byte[] GenerateExcel(AttendanceMonitoringResponse data, DateOnly rangeStart, DateOnly rangeEnd)
    {
        using var workbook = new XLWorkbook();

        var dailySheet = workbook.Worksheets.Add("Daily Records");
        dailySheet.Cell(1, 1).Value = "Employee";
        dailySheet.Cell(1, 2).Value = "Date";
        dailySheet.Cell(1, 3).Value = "Time In";
        dailySheet.Cell(1, 4).Value = "Time Out";
        dailySheet.Cell(1, 5).Value = "Daily Hours";
        dailySheet.Row(1).Style.Font.Bold = true;

        var row = 2;
        foreach (var record in data.Records.OrderBy(r => r.EmployeeName).ThenBy(r => r.Date))
        {
            dailySheet.Cell(row, 1).Value = record.EmployeeName;
            dailySheet.Cell(row, 2).Value = record.Date.ToDateTime(TimeOnly.MinValue);
            dailySheet.Cell(row, 2).Style.DateFormat.Format = "yyyy-mm-dd";
            dailySheet.Cell(row, 3).Value = record.TimeIn?.ToString("hh:mm tt") ?? "-";
            dailySheet.Cell(row, 4).Value = record.TimeOut?.ToString("hh:mm tt") ?? "-";
            dailySheet.Cell(row, 5).Value = record.DailyHours?.ToString("0.00") ?? "In progress";
            row++;
        }
        dailySheet.Columns().AdjustToContents();

        var weeklySheet = workbook.Worksheets.Add("Weekly Summary");
        weeklySheet.Cell(1, 1).Value = "Employee";
        weeklySheet.Cell(1, 2).Value = "Week Start";
        weeklySheet.Cell(1, 3).Value = "Week End";
        weeklySheet.Cell(1, 4).Value = "Total Hours";
        weeklySheet.Row(1).Style.Font.Bold = true;

        row = 2;
        foreach (var summary in data.WeeklySummaries.OrderBy(s => s.EmployeeName).ThenBy(s => s.WeekStart))
        {
            weeklySheet.Cell(row, 1).Value = summary.EmployeeName;
            weeklySheet.Cell(row, 2).Value = summary.WeekStart.ToDateTime(TimeOnly.MinValue);
            weeklySheet.Cell(row, 2).Style.DateFormat.Format = "yyyy-mm-dd";
            weeklySheet.Cell(row, 3).Value = summary.WeekEnd.ToDateTime(TimeOnly.MinValue);
            weeklySheet.Cell(row, 3).Style.DateFormat.Format = "yyyy-mm-dd";
            weeklySheet.Cell(row, 4).Value = summary.TotalHours;
            row++;
        }
        weeklySheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
