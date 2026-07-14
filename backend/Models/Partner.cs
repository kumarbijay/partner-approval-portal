using System;

namespace PartnerApprovalPortal.API.Models
{
    public class Partner
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // Specialization/Category
        public string Organization { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        
        // Placeholder for payment information, e.g. "Bank Transfer - Routing: 1234, Acct: 5678"
        public string PaymentInfo { get; set; } = string.Empty; 
        
        // Status transitions: Draft -> Submitted -> Under Review -> Approved/Rejected -> Deactivated
        public string Status { get; set; } = "Draft"; 
        
        public string CreatedBy { get; set; } = "Employee";
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedDate { get; set; }
    }
}
