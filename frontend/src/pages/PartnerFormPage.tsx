import React, { useState, useEffect } from 'react';
import { Partner } from '../mockData';

interface PartnerFormPageProps {
  partnerId?: number; // If provided, we are editing
  onSave: (partnerData: Omit<Partner, 'id' | 'status' | 'createdBy' | 'createdDate'>) => Promise<void>;
  onCancel: () => void;
  mockMode: boolean;
  apiBaseUrl: string;
}

export const PartnerFormPage: React.FC<PartnerFormPageProps> = ({
  partnerId,
  onSave,
  onCancel,
  mockMode,
  apiBaseUrl
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [aiSuggestingCategory, setAiSuggestingCategory] = useState(false);
  const [aiNormalizingAddress, setAiNormalizingAddress] = useState(false);
  
  // AI suggestions list
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [addressLog, setAddressLog] = useState<string>('');

  // Fetch partner details if editing
  useEffect(() => {
    if (partnerId) {
      setLoading(true);
      const fetchPartner = async () => {
        try {
          let data: Partner;
          if (mockMode) {
            const { mockApi } = await import('../mockData');
            data = await mockApi.getPartner(partnerId);
          } else {
            const res = await fetch(`${apiBaseUrl}/api/partners/${partnerId}`);
            if (!res.ok) throw new Error("Failed to load partner");
            data = await res.json();
          }
          
          setName(data.name);
          setEmail(data.email);
          setPhone(data.phone);
          setCategory(data.category);
          setOrganization(data.organization);
          setAddress(data.address);
          setPaymentInfo(data.paymentInfo);
        } catch (err) {
          alert("Failed to load partner information.");
          onCancel();
        } finally {
          setLoading(false);
        }
      };
      fetchPartner();
    }
  }, [partnerId]);

  // Form Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Partner name is required.";
    
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email address format.";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(phone)) {
      newErrors.phone = "Invalid phone number format (7 to 15 digits).";
    }

    if (!category.trim()) newErrors.category = "Category/Specialization is required.";
    if (!address.trim()) newErrors.address = "Address is required.";
    if (!paymentInfo.trim()) newErrors.paymentInfo = "Payment info placeholder is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave({
        name,
        email,
        phone,
        category,
        organization,
        address,
        paymentInfo
      });
    } catch (err) {
      alert("Failed to save partner profile.");
    } finally {
      setLoading(false);
    }
  };

  // AI Category Suggestion Trigger
  const handleAiCategorySuggest = async () => {
    if (!name.trim() && !organization.trim()) {
      alert("Please enter Partner Name or Organization first, so the AI has context for suggestion!");
      return;
    }

    setAiSuggestingCategory(true);
    setCategorySuggestions([]);
    
    const contextText = `${name} ${organization}`.trim();
    
    try {
      let suggestions: string[];
      if (mockMode) {
        const { mockApi } = await import('../mockData');
        suggestions = await mockApi.suggestCategory(contextText);
      } else {
        const res = await fetch(`${apiBaseUrl}/api/ai/suggest-category?description=${encodeURIComponent(contextText)}`);
        if (!res.ok) throw new Error("AI Category suggestion request failed");
        suggestions = await res.json();
      }
      setCategorySuggestions(suggestions);
    } catch (err) {
      console.warn("AI suggestion failed, using static fallback.");
      // Fallback
      setCategorySuggestions(["General Supplier", "Medical Consultant", "Clinical Lab Partner"]);
    } finally {
      setAiSuggestingCategory(false);
    }
  };

  // AI Address Normalization Trigger
  const handleAiAddressNormalize = async () => {
    if (!address.trim()) {
      alert("Please enter an address first!");
      return;
    }

    setAiNormalizingAddress(true);
    setAddressLog('');

    try {
      let normalized: { Street: string; City: string; State: string; Country: string; ZipCode: string; IsAiNormalized?: boolean };
      if (mockMode) {
        const { mockApi } = await import('../mockData');
        normalized = await mockApi.normalizeAddress(address);
        normalized.IsAiNormalized = true;
      } else {
        const res = await fetch(`${apiBaseUrl}/api/ai/normalize-address`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawAddress: address })
        });
        if (!res.ok) throw new Error("AI address normalization request failed");
        normalized = await res.json();
      }

      // Reconstruct clean address
      const formatted = [
        normalized.Street,
        normalized.City,
        normalized.State,
        normalized.Country,
        normalized.ZipCode
      ].filter(Boolean).join(', ');
      
      setAddress(formatted);
      setAddressLog(`Normalized using AI! Street: "${normalized.Street}", City: "${normalized.City}", ZIP: "${normalized.ZipCode}"`);
    } catch (err) {
      alert("Address normalization failed. Please check your address format manually.");
    } finally {
      setAiNormalizingAddress(false);
    }
  };

  return (
    <div className="card">
      <div className="form-title">
        <span>{partnerId ? 'Edit Partner Profile' : 'Onboard External Partner'}</span>
      </div>

      {loading && !name ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading profile details...
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Partner / Expert Name *</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. John Doe"
                disabled={loading}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Associated Organization / Company</label>
              <input
                type="text"
                className="form-input"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Doe Medical Consulting Ltd"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. contact@doemedical.com"
                disabled={loading}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                disabled={loading}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Category / Specialization *</label>
              <div className="input-helper-container">
                <input
                  type="text"
                  className={`form-input ${errors.category ? 'error' : ''}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Clinical Research Organization"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-ai"
                  onClick={handleAiCategorySuggest}
                  disabled={loading || aiSuggestingCategory}
                >
                  {aiSuggestingCategory ? 'Thinking...' : 'AI Suggest'}
                </button>
              </div>
              {errors.category && <span className="error-message">{errors.category}</span>}
              
              {categorySuggestions.length > 0 && (
                <div className="ai-suggestions-list">
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    AI Recommendations:
                  </span>
                  {categorySuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="ai-suggestion-chip"
                      onClick={() => setCategory(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Address *</label>
              <div className="input-helper-container">
                <input
                  type="text"
                  className={`form-input ${errors.address ? 'error' : ''}`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, Country, Zip Code"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-ai"
                  onClick={handleAiAddressNormalize}
                  disabled={loading || aiNormalizingAddress}
                >
                  {aiNormalizingAddress ? 'Normalizing...' : 'AI Normalize'}
                </button>
              </div>
              {errors.address && <span className="error-message">{errors.address}</span>}
              {addressLog && (
                <span style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>
                  ✓ {addressLog}
                </span>
              )}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Payment Information (Placeholder) *</label>
              <input
                type="text"
                className={`form-input ${errors.paymentInfo ? 'error' : ''}`}
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                placeholder="e.g. Bank: XYZ, Account No: 12345, Swift: ABC"
                disabled={loading}
              />
              {errors.paymentInfo && <span className="error-message">{errors.paymentInfo}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
