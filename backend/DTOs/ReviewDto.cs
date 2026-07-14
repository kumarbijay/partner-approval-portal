using System.ComponentModel.DataAnnotations;

namespace PartnerApprovalPortal.API.DTOs
{
    public class ReviewDto
    {
        [Required(ErrorMessage = "A comment is required for review actions.")]
        [StringLength(500, ErrorMessage = "Comments cannot exceed 500 characters.")]
        public string Comment { get; set; } = string.Empty;

        public string ReviewerName { get; set; } = "Reviewer";
    }
}
