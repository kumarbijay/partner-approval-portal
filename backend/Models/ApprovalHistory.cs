using System;

namespace PartnerApprovalPortal.API.Models
{
    public class ApprovalHistory
    {
        public int Id { get; set; }
        public int PartnerId { get; set; }
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public string ChangedBy { get; set; } = string.Empty;
        public DateTime ChangedOn { get; set; } = DateTime.UtcNow;
    }
}
