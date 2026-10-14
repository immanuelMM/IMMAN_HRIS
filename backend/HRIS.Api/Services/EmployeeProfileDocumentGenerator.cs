using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using HRIS.Api.Models;

namespace HRIS.Api.Services;

/// <summary>
/// Generates a downloadable Word copy of an employee's full personnel record
/// (the same information shown on the admin Employee Profile and employee
/// Profile pages). PDF export is handled client-side via the browser's print
/// dialog against the on-screen resume view, so both sides produce visually
/// identical output. The PIN hash and photo bytes are never serialized into
/// the Word file — only the username is included for the Account section.
/// </summary>
public static class EmployeeProfileDocumentGenerator
{
    private static string EmployeeNo(int id) => $"EMP-{id:00000}";

    private static string FormatDurationSince(DateOnly start, DateOnly? end)
    {
        var endDate = end ?? DateOnly.FromDateTime(PhilippineTime.Now);
        if (endDate < start) return "—";

        var years = endDate.Year - start.Year;
        var months = endDate.Month - start.Month;
        if (endDate.Day < start.Day) months--;
        if (months < 0) { years--; months += 12; }

        if (years == 0 && months == 0) return "Today";
        var parts = new List<string>();
        if (years > 0) parts.Add($"{years} yr{(years == 1 ? "" : "s")}");
        if (months > 0) parts.Add($"{months} mo{(months == 1 ? "" : "s")}");
        return string.Join(" ", parts);
    }

    private static string CurrentRole(Employee e) =>
        e.DepartmentHistories.FirstOrDefault(d => d.EndDate is null)?.Position ?? "Employee";

    private static IReadOnlyList<(string Label, string Value)> PersonalFields(Employee e) => new (string, string)[]
    {
        ("Date of Birth", e.DateOfBirth.ToString("yyyy-MM-dd")),
        ("Gender", e.Gender.ToString()),
        ("Civil Status", e.CivilStatus.ToString()),
    };

    private static IReadOnlyList<(string Label, string Value)> ChurchFields(Employee e) => new (string, string)[]
    {
        ("Local", e.ChurchLocal ?? "—"),
        ("District", e.ChurchDistrict ?? "—"),
        ("Province", e.ChurchProvince ?? "—"),
        ("Region", e.ChurchRegion ?? "—"),
        ("Position / Designation", e.ChurchPosition ?? "—"),
        ("Parent Religion", e.ParentReligion ?? "—"),
        ("Sabbath Date", e.SabbathDate is { } sd ? $"{sd:yyyy-MM-dd} ({FormatDurationSince(sd, null)})" : "—"),
    };

    private static IReadOnlyList<(string Label, string Value)> SkillsHealthFields(Employee e) => new (string, string)[]
    {
        ("Skills / Expertise", e.SkillsExpertise ?? "—"),
        ("Health Condition", e.HealthCondition ?? "—"),
    };

    private static IReadOnlyList<(string Label, string Value)> EmergencyContactFields(Employee e) => new (string, string)[]
    {
        ("Name", e.EmergencyContactName ?? "—"),
        ("Contact No.", e.EmergencyContactNumber ?? "—"),
        ("Address", e.EmergencyContactAddress ?? "—"),
    };

    private static IReadOnlyList<(string Label, string Value)> GovernmentIdFields(Employee e) => new (string, string)[]
    {
        ("SSS No.", e.SssNumber ?? "—"),
        ("PhilHealth No.", e.PhilHealthNumber ?? "—"),
        ("TIN No.", e.TinNumber ?? "—"),
    };

    public static byte[] GenerateWord(Employee e)
    {
        using var stream = new MemoryStream();
        using (var doc = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document))
        {
            var mainPart = doc.AddMainDocumentPart();
            mainPart.Document = new DocumentFormat.OpenXml.Wordprocessing.Document();
            var body = mainPart.Document.AppendChild(new Body());

            body.AppendChild(Heading(e.FullName, 32));
            body.AppendChild(Paragraph($"{CurrentRole(e)} — {e.CurrentDepartment?.Name ?? "No department"}", italic: true));
            body.AppendChild(Paragraph($"{EmployeeNo(e.Id)} · Generated {PhilippineTime.Now:yyyy-MM-dd HH:mm} (PHT)", small: true));
            body.AppendChild(Paragraph($"Email: {e.Email}    Phone: {e.ContactNumber}"));
            body.AppendChild(Paragraph($"Address: {e.Address}"));
            body.AppendChild(Paragraph($"Hired: {e.HireDate:yyyy-MM-dd}"));

            AddFieldSection(body, "Personal Information", PersonalFields(e));
            AddFieldSection(body, "Church Affiliation", ChurchFields(e));
            AddFieldSection(body, "Skills & Health", SkillsHealthFields(e));
            AddFieldSection(body, "Emergency Contact", EmergencyContactFields(e));
            AddFieldSection(body, "Government IDs", GovernmentIdFields(e));
            AddFieldSection(body, "Account", new (string, string)[] { ("Username", e.Account?.Username ?? "—") });

            body.AppendChild(Heading("Experience", 26));
            if (e.EmploymentHistories.Count == 0)
            {
                body.AppendChild(Paragraph("No prior employment recorded."));
            }
            else
            {
                foreach (var h in e.EmploymentHistories.OrderBy(h => h.StartDate))
                {
                    body.AppendChild(Paragraph($"{h.Position} — {h.CompanyName}", bold: true));
                    var endLabel = h.EndDate.HasValue ? h.EndDate.Value.ToString("yyyy-MM-dd") : "Present";
                    body.AppendChild(Paragraph($"{h.StartDate:yyyy-MM-dd} – {endLabel}", small: true));
                    if (!string.IsNullOrWhiteSpace(h.ReasonForLeaving))
                    {
                        body.AppendChild(Paragraph(h.ReasonForLeaving, italic: true, small: true));
                    }
                }
            }

            body.AppendChild(Heading("Career at the Company", 26));
            foreach (var d in e.DepartmentHistories.OrderBy(d => d.StartDate))
            {
                body.AppendChild(Paragraph($"{d.Position} — {d.Department?.Name}", bold: true));
                var endLabel = d.EndDate.HasValue ? d.EndDate.Value.ToString("yyyy-MM-dd") : "Present";
                body.AppendChild(Paragraph($"{d.StartDate:yyyy-MM-dd} – {endLabel}  ({FormatDurationSince(d.StartDate, d.EndDate)})", small: true));
            }

            body.AppendChild(Heading("Education", 26));
            if (e.EducationRecords.Count == 0)
            {
                body.AppendChild(Paragraph("No education records."));
            }
            else
            {
                foreach (var r in e.EducationRecords)
                {
                    body.AppendChild(Paragraph(r.SchoolName, bold: true));
                    var program = string.IsNullOrWhiteSpace(r.ProgramOrStrand) ? "" : $" — {r.ProgramOrStrand}";
                    body.AppendChild(Paragraph($"{r.Level}{program}", small: true));
                    if (r.YearGraduated.HasValue)
                    {
                        body.AppendChild(Paragraph($"Graduated {r.YearGraduated}", small: true));
                    }
                    if (!string.IsNullOrWhiteSpace(r.Honors))
                    {
                        body.AppendChild(Paragraph(r.Honors, italic: true, small: true));
                    }
                }
            }

            mainPart.Document.Save();
        }

        return stream.ToArray();
    }

    private static void AddFieldSection(Body body, string title, IReadOnlyList<(string Label, string Value)> fields)
    {
        body.AppendChild(Heading(title, 26));
        var table = new Table();
        table.AppendChild(new TableProperties(new TableBorders(
            new TopBorder { Val = BorderValues.Single, Size = 4 },
            new BottomBorder { Val = BorderValues.Single, Size = 4 },
            new LeftBorder { Val = BorderValues.Single, Size = 4 },
            new RightBorder { Val = BorderValues.Single, Size = 4 },
            new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4 },
            new InsideVerticalBorder { Val = BorderValues.Single, Size = 4 })));

        foreach (var (label, value) in fields)
        {
            var row = new TableRow();
            row.AppendChild(new TableCell(new Paragraph(new Run(new RunProperties(new Bold()), new Text(label)))));
            row.AppendChild(new TableCell(new Paragraph(new Run(new Text(value)))));
            table.AppendChild(row);
        }

        body.AppendChild(table);
        body.AppendChild(new Paragraph());
    }

    private static Paragraph Heading(string text, int fontSizeHalfPoints)
    {
        return new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "200", After = "100" }),
            new Run(
                new RunProperties(new Bold(), new FontSize { Val = fontSizeHalfPoints.ToString() }),
                new Text(text)));
    }

    private static Paragraph Paragraph(string text, bool bold = false, bool italic = false, bool small = false)
    {
        var props = new List<OpenXmlElement>();
        if (bold) props.Add(new Bold());
        if (italic) props.Add(new Italic());
        if (small) props.Add(new FontSize { Val = "18" });

        return new Paragraph(new Run(new RunProperties(props.ToArray()), new Text(text) { Space = SpaceProcessingModeValues.Preserve }));
    }
}
