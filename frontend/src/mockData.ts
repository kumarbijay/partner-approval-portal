export interface Partner {
  id: number;
  name: string;
  email: string;
  phone: string;
  category: string;
  organization: string;
  address: string;
  paymentInfo: string;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedDate?: string;
}

export interface ApprovalHistory {
  id: number;
  partnerId: number;
  oldStatus: string;
  newStatus: string;
  comment: string;
  changedBy: string;
  changedOn: string;
}

export interface AuditLog {
  id: number;
  partnerId?: number;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

const DEFAULT_PARTNERS: Partner[] = [
  {
    id: 1,
    name: "Acme Pharmaceuticals",
    email: "info@acmepharma.com",
    phone: "1234567890",
    organization: "Acme Corp",
    category: "Medical Equipment",
    address: "101 Silicon Valley, San Jose, CA, USA",
    paymentInfo: "Bank Wire - Account Ending in 4321",
    status: "Draft",
    createdBy: "Employee",
    createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    name: "BioHealth Diagnostics",
    email: "contact@biohealth.org",
    phone: "9876543210",
    organization: "BioHealth Foundation",
    category: "Diagnostics",
    address: "456 Cyber Towers, Hyderabad, Telangana, India",
    paymentInfo: "ACH - Route: 111000025, Acct: 998877",
    status: "Submitted",
    createdBy: "Employee",
    createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_HISTORY: ApprovalHistory[] = [
  {
    id: 1,
    partnerId: 2,
    oldStatus: "Draft",
    newStatus: "Submitted",
    comment: "Profile submitted for review.",
    changedBy: "Employee",
    changedOn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_AUDIT: AuditLog[] = [
  {
    id: 1,
    partnerId: 1,
    action: "Created",
    user: "Employee",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    details: "Partner profile created in Draft status."
  },
  {
    id: 2,
    partnerId: 2,
    action: "Created",
    user: "Employee",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 100000).toISOString(),
    details: "Partner profile created in Draft status."
  },
  {
    id: 3,
    partnerId: 2,
    action: "Submitted",
    user: "Employee",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    details: "Status transitioned from Draft to Submitted."
  }
];

// Local Storage Keys
const KEYS = {
  PARTNERS: "drreddy_partners",
  HISTORY: "drreddy_history",
  AUDIT: "drreddy_audit"
};

// Initialize Storage if empty
export const initializeMockStorage = () => {
  if (!localStorage.getItem(KEYS.PARTNERS)) {
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(DEFAULT_PARTNERS));
  }
  if (!localStorage.getItem(KEYS.HISTORY)) {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY));
  }
  if (!localStorage.getItem(KEYS.AUDIT)) {
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(DEFAULT_AUDIT));
  }
};

// Mock API Functions
export const mockApi = {
  getPartners: async (status?: string, search?: string): Promise<Partner[]> => {
    initializeMockStorage();
    let list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    if (status) {
      list = list.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.email.toLowerCase().includes(q) || 
        p.organization.toLowerCase().includes(q)
      );
    }
    // Sort descending by date
    return list.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  },

  getPartner: async (id: number): Promise<Partner> => {
    initializeMockStorage();
    const list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    const item = list.find(p => p.id === id);
    if (!item) throw new Error("Partner not found");
    return item;
  },

  createPartner: async (partnerData: Omit<Partner, "id" | "status" | "createdBy" | "createdDate">): Promise<Partner> => {
    initializeMockStorage();
    const list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    const nextId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
    
    const newPartner: Partner = {
      ...partnerData,
      id: nextId,
      status: "Draft",
      createdBy: "Employee",
      createdDate: new Date().toISOString()
    };
    
    list.push(newPartner);
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(list));

    // Audit log
    const audit: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.AUDIT) || "[]");
    audit.push({
      id: audit.length + 1,
      partnerId: nextId,
      action: "Created",
      user: "Employee",
      timestamp: new Date().toISOString(),
      details: "Partner profile created in Draft status (Mock Mode)."
    });
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(audit));

    return newPartner;
  },

  updatePartner: async (id: number, partnerData: Omit<Partner, "id" | "status" | "createdBy" | "createdDate">): Promise<Partner> => {
    initializeMockStorage();
    const list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Partner not found");
    
    const current = list[index];
    if (current.status !== "Draft" && current.status !== "Rejected") {
      throw new Error("Only Draft or Rejected profiles can be modified.");
    }

    const updated: Partner = {
      ...current,
      ...partnerData,
      updatedDate: new Date().toISOString()
    };
    list[index] = updated;
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(list));

    // Audit log
    const audit: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.AUDIT) || "[]");
    audit.push({
      id: audit.length + 1,
      partnerId: id,
      action: "Updated",
      user: "Employee",
      timestamp: new Date().toISOString(),
      details: "Partner profile updated (Mock Mode)."
    });
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(audit));

    return updated;
  },

  submitPartner: async (id: number): Promise<void> => {
    initializeMockStorage();
    const list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Partner not found");

    const current = list[index];
    if (current.status !== "Draft" && current.status !== "Rejected") {
      throw new Error("Only Draft or Rejected partners can be submitted.");
    }

    const oldStatus = current.status;
    current.status = "Submitted";
    current.updatedDate = new Date().toISOString();
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(list));

    // History Log
    const history: ApprovalHistory[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || "[]");
    history.push({
      id: history.length + 1,
      partnerId: id,
      oldStatus,
      newStatus: "Submitted",
      comment: "Profile submitted for review.",
      changedBy: "Employee",
      changedOn: new Date().toISOString()
    });
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));

    // Audit log
    const audit: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.AUDIT) || "[]");
    audit.push({
      id: audit.length + 1,
      partnerId: id,
      action: "Submitted",
      user: "Employee",
      timestamp: new Date().toISOString(),
      details: `Status transitioned from ${oldStatus} to Submitted (Mock Mode).`
    });
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(audit));
  },

  markUnderReview: async (id: number, reviewer: string, comment: string): Promise<void> => {
    initializeMockStorage();
    const list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Partner not found");

    const current = list[index];
    if (current.status !== "Submitted") {
      throw new Error("Only Submitted partners can be reviewed.");
    }

    const oldStatus = current.status;
    current.status = "Under Review";
    current.updatedDate = new Date().toISOString();
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(list));

    // History Log
    const history: ApprovalHistory[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || "[]");
    history.push({
      id: history.length + 1,
      partnerId: id,
      oldStatus,
      newStatus: "Under Review",
      comment,
      changedBy: reviewer,
      changedOn: new Date().toISOString()
    });
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));

    // Audit log
    const audit: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.AUDIT) || "[]");
    audit.push({
      id: audit.length + 1,
      partnerId: id,
      action: "Under Review",
      user: reviewer,
      timestamp: new Date().toISOString(),
      details: `Status transitioned from Submitted to Under Review. Comment: ${comment} (Mock Mode).`
    });
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(audit));
  },

  approvePartner: async (id: number, reviewer: string, comment: string): Promise<void> => {
    initializeMockStorage();
    const list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Partner not found");

    const current = list[index];
    if (current.status !== "Submitted" && current.status !== "Under Review") {
      throw new Error("Only Submitted or Under Review partners can be approved.");
    }

    const oldStatus = current.status;
    current.status = "Approved";
    current.updatedDate = new Date().toISOString();
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(list));

    // History Log
    const history: ApprovalHistory[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || "[]");
    history.push({
      id: history.length + 1,
      partnerId: id,
      oldStatus,
      newStatus: "Approved",
      comment,
      changedBy: reviewer,
      changedOn: new Date().toISOString()
    });
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));

    // Audit log
    const audit: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.AUDIT) || "[]");
    audit.push({
      id: audit.length + 1,
      partnerId: id,
      action: "Approved",
      user: reviewer,
      timestamp: new Date().toISOString(),
      details: `Status transitioned from ${oldStatus} to Approved. Comment: ${comment} (Mock Mode).`
    });
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(audit));
  },

  rejectPartner: async (id: number, reviewer: string, comment: string): Promise<void> => {
    initializeMockStorage();
    const list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Partner not found");

    const current = list[index];
    if (current.status !== "Submitted" && current.status !== "Under Review") {
      throw new Error("Only Submitted or Under Review partners can be rejected.");
    }

    const oldStatus = current.status;
    current.status = "Rejected";
    current.updatedDate = new Date().toISOString();
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(list));

    // History Log
    const history: ApprovalHistory[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || "[]");
    history.push({
      id: history.length + 1,
      partnerId: id,
      oldStatus,
      newStatus: "Rejected",
      comment,
      changedBy: reviewer,
      changedOn: new Date().toISOString()
    });
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));

    // Audit log
    const audit: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.AUDIT) || "[]");
    audit.push({
      id: audit.length + 1,
      partnerId: id,
      action: "Rejected",
      user: reviewer,
      timestamp: new Date().toISOString(),
      details: `Status transitioned from ${oldStatus} to Rejected. Comment: ${comment} (Mock Mode).`
    });
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(audit));
  },

  deactivatePartner: async (id: number, reviewer: string, comment: string): Promise<void> => {
    initializeMockStorage();
    const list: Partner[] = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || "[]");
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Partner not found");

    const current = list[index];
    if (current.status !== "Approved") {
      throw new Error("Only Approved partners can be deactivated.");
    }

    const oldStatus = current.status;
    current.status = "Deactivated";
    current.updatedDate = new Date().toISOString();
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(list));

    // History Log
    const history: ApprovalHistory[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || "[]");
    history.push({
      id: history.length + 1,
      partnerId: id,
      oldStatus,
      newStatus: "Deactivated",
      comment,
      changedBy: reviewer,
      changedOn: new Date().toISOString()
    });
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));

    // Audit log
    const audit: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.AUDIT) || "[]");
    audit.push({
      id: audit.length + 1,
      partnerId: id,
      action: "Deactivated",
      user: reviewer,
      timestamp: new Date().toISOString(),
      details: `Status transitioned from Approved to Deactivated. Reason: {comment} (Mock Mode).`
    });
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(audit));
  },

  getHistory: async (partnerId: number): Promise<ApprovalHistory[]> => {
    initializeMockStorage();
    const history: ApprovalHistory[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || "[]");
    return history.filter(h => h.partnerId === partnerId).sort((a, b) => new Date(b.changedOn).getTime() - new Date(a.changedOn).getTime());
  },

  getAudit: async (partnerId: number): Promise<AuditLog[]> => {
    initializeMockStorage();
    const audit: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.AUDIT) || "[]");
    return audit.filter(a => a.partnerId === partnerId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // Mock AI Suggestions using local client simulation
  suggestCategory: async (description: string): Promise<string[]> => {
    await new Promise(r => setTimeout(r, 600)); // Simulate latency
    const text = description.toLowerCase();
    
    if (text.includes("research") || text.includes("clinical") || text.includes("trial") || text.includes("lab")) {
      return ["Clinical Research Org (CRO)", "R&D Partner", "Scientific Service Provider"];
    } else if (text.includes("delivery") || text.includes("ship") || text.includes("transport") || text.includes("logistics") || text.includes("warehouse")) {
      return ["Logistics & Distribution", "Cold Chain Vendor", "Supply Chain Partner"];
    } else if (text.includes("chemical") || text.includes("ingredient") || text.includes("raw") || text.includes("api") || text.includes("substance")) {
      return ["API & Raw Materials Supplier", "Chemical Manufacturer", "Excipient Supplier"];
    } else if (text.includes("software") || text.includes("it") || text.includes("code") || text.includes("cloud") || text.includes("computer") || text.includes("tech")) {
      return ["IT & Software Services", "SaaS Provider", "Digital Health Partner"];
    } else if (text.includes("pack") || text.includes("box") || text.includes("bottle") || text.includes("label")) {
      return ["Packaging Vendor", "Printing & Labeling", "Materials Supplier"];
    }
    return ["General Service Provider", "Commercial Partner", "Consulting & Advisory"];
  },

  normalizeAddress: async (rawAddress: string): Promise<{ Street: string; City: string; State: string; Country: string; ZipCode: string }> => {
    await new Promise(r => setTimeout(r, 600)); // Simulate latency
    const parts = rawAddress.split(',').map(s => s.trim());
    const result = {
      Street: "",
      City: "",
      State: "",
      Country: "",
      ZipCode: ""
    };
    
    if (parts.length > 0) {
      if (parts.length === 1) {
        result.Street = parts[0];
      } else if (parts.length === 2) {
        result.Street = parts[0];
        result.City = parts[1];
      } else if (parts.length === 3) {
        result.Street = parts[0];
        result.City = parts[1];
        result.Country = parts[2];
      } else {
        result.Street = parts.slice(0, -3).join(", ");
        result.City = parts[parts.length - 3];
        result.State = parts[parts.length - 2];
        result.Country = parts[parts.length - 1];
      }
      
      // Attempt to extract 5 or 6 digit numbers (zip code)
      const numberMatch = rawAddress.match(/\b\d{5,6}\b/);
      if (numberMatch) {
        result.ZipCode = numberMatch[0];
      }
    }
    
    return result;
  }
};
