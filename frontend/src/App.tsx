import { useState, useEffect } from 'react';
import { Partner, mockApi, initializeMockStorage } from './mockData';
import { PartnerListPage } from './pages/PartnerListPage';
import { PartnerFormPage } from './pages/PartnerFormPage';
import { PartnerReviewPage } from './pages/PartnerReviewPage';

const API_BASE_URL = 'http://localhost:5237';

function App() {
  const [currentPage, setCurrentPage] = useState<'list' | 'create' | 'edit' | 'review'>('list');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | undefined>(undefined);
  
  // Settings States
  const [currentRole, setCurrentRole] = useState<'Employee' | 'Reviewer'>('Employee');
  const [mockMode, setMockMode] = useState<boolean>(true); // Default to mock mode for easy preview

  // Core Data States
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({ status: '', query: '' });

  // Initialize localStorage if needed
  useEffect(() => {
    initializeMockStorage();
    loadPartners();
  }, [mockMode, searchParams]);

  const loadPartners = async () => {
    setLoading(true);
    try {
      if (mockMode) {
        const list = await mockApi.getPartners(searchParams.status, searchParams.query);
        setPartners(list);
      } else {
        const queryParams = new URLSearchParams();
        if (searchParams.status) queryParams.append('status', searchParams.status);
        if (searchParams.query) queryParams.append('search', searchParams.query);

        const res = await fetch(`${API_BASE_URL}/api/partners?${queryParams.toString()}`);
        if (!res.ok) throw new Error("API failed");
        const list = await res.json();
        setPartners(list);
      }
    } catch (err) {
      console.error("Failed to load partners, falling back to mock storage:", err);
      // Fail-safe fallback to mock storage in case live API is not running
      const list = await mockApi.getPartners(searchParams.status, searchParams.query);
      setPartners(list);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (status: string, query: string) => {
    setSearchParams({ status, query });
  };

  const handleNavigateToEdit = () => {
    setCurrentPage('edit');
  };

  const handleSelectPartner = (id: number) => {
    setSelectedPartnerId(id);
    setCurrentPage('review');
  };

  // Submit Partner logic
  const handleSubmitForApproval = async (id: number) => {
    if (mockMode) {
      await mockApi.submitPartner(id);
    } else {
      const res = await fetch(`${API_BASE_URL}/api/partners/${id}/submit`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to submit");
    }
    await loadPartners();
  };

  // Create or Update Partner logic
  const handleSavePartner = async (partnerData: Omit<Partner, 'id' | 'status' | 'createdBy' | 'createdDate'>) => {
    if (selectedPartnerId) {
      // Update
      if (mockMode) {
        await mockApi.updatePartner(selectedPartnerId, partnerData);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/partners/${selectedPartnerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partnerData)
        });
        if (!res.ok) throw new Error("Failed to update");
      }
    } else {
      // Create
      if (mockMode) {
        await mockApi.createPartner(partnerData);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/partners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partnerData)
        });
        if (!res.ok) throw new Error("Failed to create");
      }
    }
    
    setCurrentPage('list');
    setSelectedPartnerId(undefined);
    await loadPartners();
  };

  // Review actions (review, approve, reject, deactivate)
  const handleReviewAction = async (action: 'review' | 'approve' | 'reject' | 'deactivate', comment: string) => {
    if (!selectedPartnerId) return;

    if (mockMode) {
      if (action === 'review') {
        await mockApi.markUnderReview(selectedPartnerId, currentRole, comment);
      } else if (action === 'approve') {
        await mockApi.approvePartner(selectedPartnerId, currentRole, comment);
      } else if (action === 'reject') {
        await mockApi.rejectPartner(selectedPartnerId, currentRole, comment);
      } else if (action === 'deactivate') {
        await mockApi.deactivatePartner(selectedPartnerId, currentRole, comment);
      }
    } else {
      const endpoint = `${API_BASE_URL}/api/partners/${selectedPartnerId}/${action}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, reviewerName: currentRole })
      });
      if (!res.ok) throw new Error("Action failed");
    }
    await loadPartners();
  };

  return (
    <div className="app-container">
      {/* Premium Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">RD</div>
          <div>
            <h1 className="logo-title">Dr. Reddy's</h1>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.5px' }}>
              PARTNER ONBOARDING PORTAL
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className="select-wrapper">
            <span className="select-label">View As:</span>
            <select
              className="custom-select"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as 'Employee' | 'Reviewer')}
            >
              <option value="Employee">Employee (Initiator)</option>
              <option value="Reviewer">Reviewer (Approver)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="mockMode"
              checked={mockMode}
              onChange={(e) => setMockMode(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label 
              htmlFor="mockMode" 
              style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer', fontWeight: 500 }}
            >
              Mock API Mode
            </label>
          </div>
        </div>
      </header>

      {/* Mock Mode Banner */}
      {mockMode && (
        <div className="mode-banner">
          <div className="mode-banner-text">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Mock API Mode is Active:</strong> Edits are saved to your browser's local storage. This allows full operation (including AI category and address normalization stubs) without running the C# backend.
            </span>
          </div>
          <button className="btn btn-secondary" onClick={() => setMockMode(false)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
            Connect C# API
          </button>
        </div>
      )}

      {/* Pages Container */}
      {currentPage === 'list' && (
        <PartnerListPage
          partners={partners}
          onSelectPartner={handleSelectPartner}
          onNavigateToCreate={() => {
            setSelectedPartnerId(undefined);
            setCurrentPage('create');
          }}
          currentRole={currentRole}
          onSearch={handleSearchChange}
          onSubmitForApproval={handleSubmitForApproval}
        />
      )}

      {(currentPage === 'create' || currentPage === 'edit') && (
        <PartnerFormPage
          partnerId={selectedPartnerId}
          onSave={handleSavePartner}
          onCancel={() => {
            setSelectedPartnerId(undefined);
            setCurrentPage('list');
          }}
          mockMode={mockMode}
          apiBaseUrl={API_BASE_URL}
        />
      )}

      {currentPage === 'review' && selectedPartnerId !== undefined && (
        <PartnerReviewPage
          partnerId={selectedPartnerId}
          currentRole={currentRole}
          onBack={() => {
            setSelectedPartnerId(undefined);
            setCurrentPage('list');
          }}
          onEdit={handleNavigateToEdit}
          onSubmitForApproval={() => handleSubmitForApproval(selectedPartnerId)}
          onReviewAction={handleReviewAction}
          mockMode={mockMode}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  );
}

export default App;
