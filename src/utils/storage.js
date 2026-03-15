// localStorage helper with error handling
// This ensures your admin config and leads survive page refreshes!

const STORAGE_KEYS = {
  CONFIG: "cleanbid_config",
  LEADS: "cleanbid_leads",
};

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn("Could not save config to localStorage:", err);
  }
}

export function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn("Could not load config from localStorage:", err);
    return null;
  }
}

export function saveLeads(leads) {
  try {
    // Don't save photo data URLs to localStorage (they're huge)
    const leadsWithoutPhotos = leads.map((lead) => ({
      ...lead,
      photos: lead.photos?.map((p) => ({ id: p.id, name: p.name })) || [],
    }));
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leadsWithoutPhotos));
  } catch (err) {
    console.warn("Could not save leads to localStorage:", err);
  }
}

export function loadLeads() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn("Could not load leads from localStorage:", err);
    return null;
  }
}
