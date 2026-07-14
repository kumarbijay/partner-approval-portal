import React, { useState, useEffect } from 'react';
import { Partner, ApprovalHistory, AuditLog } from '../mockData';

interface PartnerReviewPageProps {
  partnerId: number;
  currentRole: string;
  onBack: () => void;
  onEdit: () => void;
  onSubmitForApproval: () => Promise<void>;
  onReviewAction: (action: 'review' | 'approve' | 'reject' | 'deactivate', comment: string) => Promise<void>;
  mockMode: boolean;
  apiBaseUrl: string;
}

export const PartnerReviewPage: React.FC<PartnerReviewPageProps> = ({
  partnerId,
  currentRole,
  onBack,
  onEdit,
  onSubmitForApproval,
  onReviewAction,
  mockMode,
  apiBaseUrl
}) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [history, setHistory] = useState<ApprovalHistory[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionComment, setActionComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'audit'>('history');

  const fetchData = async () => {
    setLoading(true);
    try {
      let partnerData: Partner;
      let historyData: ApprovalHistory[];
      let auditData: AuditLog[];

      if (mockMode) {
        const { mockApi } = await import('../mockData');
        partnerData = await mockApi.getPartner(partnerId);
        historyData = await mockApi.getHistory(partnerId);
        auditData = await mockApi.getAudit(partnerId);
      } else {
        const [pRes, hRes, aRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/partners/${partnerId}`),
          fetch(`${apiBaseUrl}/api/partners/${partnerId}/history`),
          fetch(`${apiBaseUrl}/api/partners/${partnerId}/audit`)
        ]);

        if (!pRes.ok) throw new Error("Failed to load partner info");
        partnerData = await pRes.json();
        historyData = hRes.ok ? await hRes.json() : [];
        auditData = aRes.ok ? await aRes.json() : [];
      }

      setPartner(partnerData);
      setHistory(historyData);
      setAudit(auditData);
    } catch (err) {
      alert("Failed to load partner details.");
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [partnerId]);

  const handleAction = async (action: 'review' | 'approve' | 'reject' | 'deactivate') => {
    if (!actionComment.trim()) {
      alert("Please provide a comment for this review action.");
      return;
    }

    setActionLoading(true);
    try {
      await onReviewAction(action, actionComment);
      setActionComment('');
      await fetchData(); // Refresh data
    } catch (err) {
      alert(`Failed to complete action: ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await onSubmitForApproval();
      await fetchData();
    } catch (err) {
      alert("Failed to submit partner profile.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'status-badge draft';
      case 'submitted': return 'status-badge submitted';
      case 'under review': return 'status-badge under review';
      case 'approved': return 'status-badge approved';
      case 'rejected': return 'status-badge rejected';
      case 'deactivated': return 'status-badge deactivated';
      default: return 'status-badge';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading profile details...
        </div>
      </div>
    );
  }

  if (!partner) return null;

  return (
    <div className="card">
      <div className="form-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.8rem' }}>
            ← Back
          </button>
          <span>Partner Profile Details</span>
        </div>
        <span className={getStatusBadgeClass(partner.status)}>{partner.status}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <div className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', color: 'white' }}>
              General Information
            </h3>
            
            <div className="detail-row">
              <span className="detail-label">Name / Specialist</span>
              <span className="detail-value" style={{ fontWeight: 600 }}>{partner.name}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Organization</span>
              <span className="detail-value">{partner.organization || '—'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Specialization / Category</span>
              <span className="detail-value">{partner.category}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Email Address</span>
              <span className="detail-value">{partner.email}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Phone Number</span>
              <span className="detail-value">{partner.phone}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Full Address</span>
              <span className="detail-value">{partner.address}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Payment Information (Placeholder)</span>
              <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {partner.paymentInfo}
              </span>
            </div>
            
            <div className="detail-row" style={{ borderBottom: 'none' }}>
              <span className="detail-label">Onboarding Initiated</span>
              <span className="detail-value">{new Date(partner.createdDate).toLocaleString()}</span>
            </div>
          </div>

          {/* Workflow Actions Section */}
          <div className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', color: 'white' }}>
              Workflow Control Panel
            </h3>

            {/* Employee Actions */}
            {currentRole === 'Employee' && (
              <div>
                {(partner.status === 'Draft' || partner.status === 'Rejected') ? (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={onEdit} disabled={actionLoading}>
                      Edit Profile Info
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={actionLoading}>
                      {actionLoading ? 'Submitting...' : 'Submit Profile for Review'}
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    Profile is currently {partner.status}. No editing actions are permitted.
                  </p>
                )}
              </div>
            )}

            {/* Reviewer Actions */}
            {currentRole === 'Reviewer' && (
              <div>
                {partner.status === 'Submitted' && (
                  <div>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Review Comment *
                    </label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '80px', marginBottom: '1rem', resize: 'vertical' }}
                      placeholder="Add compliance assessment details, verification comments..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      disabled={actionLoading}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-warning" 
                        onClick={() => handleAction('review')} 
                        disabled={actionLoading}
                      >
                        Mark Under Review
                      </button>
                      <button 
                        className="btn btn-success" 
                        onClick={() => handleAction('approve')} 
                        disabled={actionLoading}
                      >
                        Approve Profile
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleAction('reject')} 
                        disabled={actionLoading}
                      >
                        Reject Profile
                      </button>
                    </div>
                  </div>
                )}

                {partner.status === 'Under Review' && (
                  <div>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Review Comment *
                    </label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '80px', marginBottom: '1rem', resize: 'vertical' }}
                      placeholder="Add final compliance notes before decision..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      disabled={actionLoading}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        className="btn btn-success" 
                        onClick={() => handleAction('approve')} 
                        disabled={actionLoading}
                      >
                        Approve Profile
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleAction('reject')} 
                        disabled={actionLoading}
                      >
                        Reject Profile
                      </button>
                    </div>
                  </div>
                )}

                {partner.status === 'Approved' && (
                  <div>
                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Deactivation Reason *
                    </label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '80px', marginBottom: '1rem', resize: 'vertical' }}
                      placeholder="Enter the reason why this partner is being deactivated..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      disabled={actionLoading}
                    />
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleAction('deactivate')} 
                      disabled={actionLoading}
                    >
                      Deactivate Partner
                    </button>
                  </div>
                )}

                {(partner.status === 'Rejected' || partner.status === 'Deactivated') && (
                  <p style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    This profile is {partner.status}. No reviewer actions are available.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History / Audit Tabs */}
        <div>
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Approval History
            </button>
            <button 
              className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Audit Trail
            </button>
          </div>

          {activeTab === 'history' && (
            <div className="timeline">
              {history.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.875rem', padding: '1rem 0' }}>
                  No approval transitions logged.
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={h.id} className={`timeline-item ${i === 0 ? 'active' : ''}`}>
                    <div className="timeline-header">
                      <span className="timeline-user">{h.changedBy}</span>
                      <span>{new Date(h.changedOn).toLocaleString()}</span>
                    </div>
                    <div style={{ margin: '0.2rem 0' }}>
                      Transition: <span style={{ fontWeight: 600, color: '#93c5fd' }}>{h.oldStatus}</span> → <span style={{ fontWeight: 600, color: '#34d399' }}>{h.newStatus}</span>
                    </div>
                    {h.comment && <div className="timeline-comment">{h.comment}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="timeline">
              {audit.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.875rem', padding: '1rem 0' }}>
                  No audit logs recorded.
                </div>
              ) : (
                audit.map((a, i) => (
                  <div key={a.id} className={`timeline-item ${i === 0 ? 'active' : ''}`}>
                    <div className="timeline-header">
                      <span className="timeline-user">{a.user}</span>
                      <span>{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#818cf8', margin: '0.25rem 0' }}>
                      {a.action}
                    </div>
                    <div style={{ color: '#94a3b8' }}>{a.details}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
