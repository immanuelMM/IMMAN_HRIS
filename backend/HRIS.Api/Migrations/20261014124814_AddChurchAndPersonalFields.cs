using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRIS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddChurchAndPersonalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChurchDistrict",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChurchLocal",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChurchPosition",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChurchProvince",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChurchRegion",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactAddress",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactName",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactNumber",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HealthCondition",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentReligion",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhilHealthNumber",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "SabbathDate",
                table: "Employees",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SkillsExpertise",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SssNumber",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TinNumber",
                table: "Employees",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChurchDistrict",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ChurchLocal",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ChurchPosition",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ChurchProvince",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ChurchRegion",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyContactAddress",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyContactName",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmergencyContactNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "HealthCondition",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ParentReligion",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PhilHealthNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "SabbathDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "SkillsExpertise",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "SssNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "TinNumber",
                table: "Employees");
        }
    }
}
