using System.ComponentModel.DataAnnotations;

namespace PartnerApprovalPortal.API.DTOs
{
    public class UpdatePartnerDto
    {
        [Required(ErrorMessage = "Partner name is required.")]
        [StringLength(100, ErrorMessage = "Partner name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required.")]
        [Phone(ErrorMessage = "Invalid phone number format.")]
        public string Phone { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Organization name cannot exceed 100 characters.")]
        public string Organization { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category/Specialization is required.")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "Address is required.")]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "Payment information placeholder is required.")]
        [StringLength(200, ErrorMessage = "Payment information details cannot exceed 200 characters.")]
        public string PaymentInfo { get; set; } = string.Empty;
    }
}
