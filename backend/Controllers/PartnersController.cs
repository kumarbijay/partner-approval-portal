using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PartnerApprovalPortal.API.Data;
using PartnerApprovalPortal.API.DTOs;
using PartnerApprovalPortal.API.Models;

namespace PartnerApprovalPortal.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartnersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PartnersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/partners
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Partner>>> GetPartners(
            [FromQuery] string? status, 
            [FromQuery] string? search)
        {
            var query = _context.Partners.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(p => 
                    p.Name.ToLower().Contains(lowerSearch) || 
                    p.Email.ToLower().Contains(lowerSearch) || 
                    p.Organization.ToLower().Contains(lowerSearch)
                );
            }

            return await query.OrderByDescending(p => p.CreatedDate).ToListAsync();
        }

        // GET: api/partners/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Partner>> GetPartner(int id)
        {
            var partner = await _context.Partners.FindAsync(id);

            if (partner == null)
            {
                return NotFound(new { message = $"Partner with ID {id} not found." });
            }

            return partner;
        }

        // POST: api/partners
        [HttpPost]
        public async Task<ActionResult<Partner>> CreatePartner(CreatePartnerDto dto)
        {
            var partner = new Partner
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Organization = dto.Organization,
                Category = dto.Category,
                Address = dto.Address,
                PaymentInfo = dto.PaymentInfo,
                Status = "Draft",
                CreatedBy = "Employee",
                CreatedDate = DateTime.UtcNow
            };

            _context.Partners.Add(partner);
            await _context.SaveChangesAsync();

            // Log Audit Entry
            _context.AuditLogs.Add(new AuditLog
            {
                PartnerId = partner.Id,
                Action = "Created",
                User = "Employee",
                Timestamp = DateTime.UtcNow,
                Details = "Partner profile created in Draft status."
            });
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPartner), new { id = partner.Id }, partner);
        }

        // PUT: api/partners/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePartner(int id, UpdatePartnerDto dto)
        {
            var partner = await _context.Partners.FindAsync(id);

            if (partner == null)
            {
                return NotFound(new { message = $"Partner with ID {id} not found." });
            }

            // Validation: Only allow updates in Draft or Rejected status
            if (partner.Status != "Draft" && partner.Status != "Rejected")
            {
                return BadRequest(new { message = "Only partners in 'Draft' or 'Rejected' status can be modified." });
            }

            partner.Name = dto.Name;
            partner.Email = dto.Email;
            partner.Phone = dto.Phone;
            partner.Organization = dto.Organization;
            partner.Category = dto.Category;
            partner.Address = dto.Address;
            partner.PaymentInfo = dto.PaymentInfo;
            partner.UpdatedDate = DateTime.UtcNow;

            _context.Entry(partner).State = EntityState.Modified;

            // Log Audit Entry
            _context.AuditLogs.Add(new AuditLog
            {
                PartnerId = partner.Id,
                Action = "Updated",
                User = "Employee",
                Timestamp = DateTime.UtcNow,
                Details = "Partner profile updated."
            });

            await _context.SaveChangesAsync();

            return Ok(partner);
        }

        // POST: api/partners/5/submit
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> SubmitPartner(int id)
        {
            var partner = await _context.Partners.FindAsync(id);

            if (partner == null)
            {
                return NotFound(new { message = $"Partner with ID {id} not found." });
            }

            if (partner.Status != "Draft" && partner.Status != "Rejected")
            {
                return BadRequest(new { message = "Only 'Draft' or 'Rejected' partners can be submitted for review." });
            }

            string oldStatus = partner.Status;
            partner.Status = "Submitted";
            partner.UpdatedDate = DateTime.UtcNow;

            _context.ApprovalHistories.Add(new ApprovalHistory
            {
                PartnerId = partner.Id,
                OldStatus = oldStatus,
                NewStatus = "Submitted",
                Comment = "Profile submitted for review.",
                ChangedBy = "Employee",
                ChangedOn = DateTime.UtcNow
            });

            _context.AuditLogs.Add(new AuditLog
            {
                PartnerId = partner.Id,
                Action = "Submitted",
                User = "Employee",
                Timestamp = DateTime.UtcNow,
                Details = $"Status transitioned from {oldStatus} to Submitted."
            });

            await _context.SaveChangesAsync();

            return Ok(new { status = partner.Status, message = "Partner submitted successfully." });
        }

        // POST: api/partners/5/review
        [HttpPost("{id}/review")]
        public async Task<IActionResult> MarkUnderReview(int id, ReviewDto dto)
        {
            var partner = await _context.Partners.FindAsync(id);

            if (partner == null)
            {
                return NotFound(new { message = $"Partner with ID {id} not found." });
            }

            if (partner.Status != "Submitted")
            {
                return BadRequest(new { message = "Only 'Submitted' partners can be marked as Under Review." });
            }

            string oldStatus = partner.Status;
            partner.Status = "Under Review";
            partner.UpdatedDate = DateTime.UtcNow;

            _context.ApprovalHistories.Add(new ApprovalHistory
            {
                PartnerId = partner.Id,
                OldStatus = oldStatus,
                NewStatus = "Under Review",
                Comment = dto.Comment,
                ChangedBy = dto.ReviewerName,
                ChangedOn = DateTime.UtcNow
            });

            _context.AuditLogs.Add(new AuditLog
            {
                PartnerId = partner.Id,
                Action = "Under Review",
                User = dto.ReviewerName,
                Timestamp = DateTime.UtcNow,
                Details = $"Status transitioned from Submitted to Under Review. Comment: {dto.Comment}"
            });

            await _context.SaveChangesAsync();

            return Ok(new { status = partner.Status, message = "Partner is now Under Review." });
        }

        // POST: api/partners/5/approve
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApprovePartner(int id, ReviewDto dto)
        {
            var partner = await _context.Partners.FindAsync(id);

            if (partner == null)
            {
                return NotFound(new { message = $"Partner with ID {id} not found." });
            }

            if (partner.Status != "Submitted" && partner.Status != "Under Review")
            {
                return BadRequest(new { message = "Only 'Submitted' or 'Under Review' partners can be approved." });
            }

            string oldStatus = partner.Status;
            partner.Status = "Approved";
            partner.UpdatedDate = DateTime.UtcNow;

            _context.ApprovalHistories.Add(new ApprovalHistory
            {
                PartnerId = partner.Id,
                OldStatus = oldStatus,
                NewStatus = "Approved",
                Comment = dto.Comment,
                ChangedBy = dto.ReviewerName,
                ChangedOn = DateTime.UtcNow
            });

            _context.AuditLogs.Add(new AuditLog
            {
                PartnerId = partner.Id,
                Action = "Approved",
                User = dto.ReviewerName,
                Timestamp = DateTime.UtcNow,
                Details = $"Status transitioned from {oldStatus} to Approved. Comment: {dto.Comment}"
            });

            await _context.SaveChangesAsync();

            return Ok(new { status = partner.Status, message = "Partner approved successfully." });
        }

        // POST: api/partners/5/reject
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectPartner(int id, ReviewDto dto)
        {
            var partner = await _context.Partners.FindAsync(id);

            if (partner == null)
            {
                return NotFound(new { message = $"Partner with ID {id} not found." });
            }

            if (partner.Status != "Submitted" && partner.Status != "Under Review")
            {
                return BadRequest(new { message = "Only 'Submitted' or 'Under Review' partners can be rejected." });
            }

            string oldStatus = partner.Status;
            partner.Status = "Rejected";
            partner.UpdatedDate = DateTime.UtcNow;

            _context.ApprovalHistories.Add(new ApprovalHistory
            {
                PartnerId = partner.Id,
                OldStatus = oldStatus,
                NewStatus = "Rejected",
                Comment = dto.Comment,
                ChangedBy = dto.ReviewerName,
                ChangedOn = DateTime.UtcNow
            });

            _context.AuditLogs.Add(new AuditLog
            {
                PartnerId = partner.Id,
                Action = "Rejected",
                User = dto.ReviewerName,
                Timestamp = DateTime.UtcNow,
                Details = $"Status transitioned from {oldStatus} to Rejected. Comment: {dto.Comment}"
            });

            await _context.SaveChangesAsync();

            return Ok(new { status = partner.Status, message = "Partner rejected successfully." });
        }

        // POST: api/partners/5/deactivate
        [HttpPost("{id}/deactivate")]
        public async Task<IActionResult> DeactivatePartner(int id, ReviewDto dto)
        {
            var partner = await _context.Partners.FindAsync(id);

            if (partner == null)
            {
                return NotFound(new { message = $"Partner with ID {id} not found." });
            }

            if (partner.Status != "Approved")
            {
                return BadRequest(new { message = "Only 'Approved' partners can be deactivated." });
            }

            string oldStatus = partner.Status;
            partner.Status = "Deactivated";
            partner.UpdatedDate = DateTime.UtcNow;

            _context.ApprovalHistories.Add(new ApprovalHistory
            {
                PartnerId = partner.Id,
                OldStatus = oldStatus,
                NewStatus = "Deactivated",
                Comment = dto.Comment,
                ChangedBy = dto.ReviewerName,
                ChangedOn = DateTime.UtcNow
            });

            _context.AuditLogs.Add(new AuditLog
            {
                PartnerId = partner.Id,
                Action = "Deactivated",
                User = dto.ReviewerName,
                Timestamp = DateTime.UtcNow,
                Details = $"Status transitioned from Approved to Deactivated. Reason: {dto.Comment}"
            });

            await _context.SaveChangesAsync();

            return Ok(new { status = partner.Status, message = "Partner deactivated successfully." });
        }

        // GET: api/partners/5/history
        [HttpGet("{id}/history")]
        public async Task<ActionResult<IEnumerable<ApprovalHistory>>> GetPartnerHistory(int id)
        {
            var history = await _context.ApprovalHistories
                .Where(h => h.PartnerId == id)
                .OrderByDescending(h => h.ChangedOn)
                .ToListAsync();

            return history;
        }

        // GET: api/partners/5/audit
        [HttpGet("{id}/audit")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetPartnerAudit(int id)
        {
            var audit = await _context.AuditLogs
                .Where(a => a.PartnerId == id)
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();

            return audit;
        }
    }
}
