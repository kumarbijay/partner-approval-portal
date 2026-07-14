import React, { useState, useEffect } from 'react';
import type { Partner } from '../mockData';

interface PartnerListPageProps {
  partners: Partner[];
  onSelectPartner: (id: number) => void;
  onNavigateToCreate: () => void;
  currentRole: string;
  onSearch: (status: string, query: string) => void;
  onSubmitForApproval: (id: number) => Promise<void>;
}

export const PartnerListPage: React.FC<PartnerListPageProps> = ({
  partners,
  onSelectPartner,
  onNavigateToCreate,
  currentRole,
  onSearch,
  onSubmitForApproval
}) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingIds, setSubmittingIds] = useState<number[]>([]);

  useEffect(() => {
    onSearch(statusFilter, searchQuery);
  }, [statusFilter, searchQuery]);

  const handleSubmit = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Avoid triggering list item selection
    setSubmittingIds(prev => [...prev, id]);
    try {
      await onSubmitForApproval(id);
    } catch (err) {
      alert("Failed to submit partner profile.");
    } finally {
      setSubmittingIds(prev => prev.filter(x => x !== id));
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

  return (
    <div className="card">
      <div className="form-title">
        <span>External Partners Directory</span>
        {currentRole === 'Employee' && (
          <button className="btn btn-primary" onClick={onNavigateToCreate}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Onboard New Partner
          </button>
        )}
      </div>

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="select-wrapper">
          <span className="select-label">Status:</span>
          <select
            className="custom-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {partners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No partners found matching the filters.
          </div>
        ) : (
          <table className="partner-table">
            <thead>
              <tr>
                <th>Partner Name</th>
                <th>Organization</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr 
                  key={partner.id} 
                  onClick={() => onSelectPartner(partner.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600 }}>{partner.name}</td>
                  <td>{partner.organization || '—'}</td>
                  <td>{partner.category}</td>
                  <td>
                    <span className={getStatusBadgeClass(partner.status)}>
                      {partner.status}
                    </span>
                  </td>
                  <td>{new Date(partner.createdDate).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => onSelectPartner(partner.id)}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                      >
                        Details
                      </button>
                      
                      {currentRole === 'Employee' && (partner.status === 'Draft' || partner.status === 'Rejected') && (
                        <button
                          className="btn btn-warning"
                          onClick={(e) => handleSubmit(e, partner.id)}
                          disabled={submittingIds.includes(partner.id)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                        >
                          {submittingIds.includes(partner.id) ? 'Submitting...' : 'Submit'}
                        </button>
                      )}

                      {currentRole === 'Reviewer' && partner.status === 'Submitted' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => onSelectPartner(partner.id)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
