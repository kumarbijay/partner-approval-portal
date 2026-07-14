using System;

namespace PartnerApprovalPortal.API.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int? PartnerId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string User { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Details { get; set; } = string.Empty;
    }
}
