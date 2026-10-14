using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRIS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentIdCardTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdCardTemplate",
                table: "Departments",
                type: "text",
                nullable: false,
                defaultValue: "wave");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IdCardTemplate",
                table: "Departments");
        }
    }
}
