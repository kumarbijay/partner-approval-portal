using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PartnerApprovalPortal.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentInfoAndStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentInfo",
                table: "Partners",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Partners",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PaymentInfo" },
                values: new object[] { new DateTime(2026, 7, 9, 14, 44, 8, 939, DateTimeKind.Utc).AddTicks(1288), "Bank Wire - Account Ending in 4321" });

            migrationBuilder.UpdateData(
                table: "Partners",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedDate", "PaymentInfo" },
                values: new object[] { new DateTime(2026, 7, 12, 14, 44, 8, 939, DateTimeKind.Utc).AddTicks(1297), "ACH - Route: 111000025, Acct: 998877" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentInfo",
                table: "Partners");

            migrationBuilder.UpdateData(
                table: "Partners",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 9, 14, 38, 0, 356, DateTimeKind.Utc).AddTicks(5322));

            migrationBuilder.UpdateData(
                table: "Partners",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 12, 14, 38, 0, 356, DateTimeKind.Utc).AddTicks(5330));
        }
    }
}
