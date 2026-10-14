using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HRIS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentLogoColorAndPositions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoContentType",
                table: "Departments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "LogoData",
                table: "Departments",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TeamColor",
                table: "Departments",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DepartmentPositions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DepartmentId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepartmentPositions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DepartmentPositions_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentPositions_DepartmentId",
                table: "DepartmentPositions",
                column: "DepartmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DepartmentPositions");

            migrationBuilder.DropColumn(
                name: "LogoContentType",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "LogoData",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "TeamColor",
                table: "Departments");
        }
    }
}
