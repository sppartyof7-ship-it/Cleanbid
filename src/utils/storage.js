// localStorage helper with error handling
// Tenant-aware: each business gets its own storage namespace

import { resolveTenant } from "../tenants";

function getStorageKeys() {
  const tenant = resolveTenant();
  const prefix = tenant.id || "cloutebid";
  return {
    CONFIG: `${prefix}_config`,
    LEADS: `${prefix}_leads`,
  };
}

export function saveConfig(config) {
  try {
    const keys = getStorageKeys();
    localStorage.setItem(keys.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn("Could not save config to localStorage:", err);
  }
}

export function loadConfig() {
  try {
    const keys = getStorageKeys();
    const saved = localStorage.getItem(keys.CONFIG);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn("Could not load config from localStorage:", err);
    return null;
  }
}

export function saveLeads(leads) {
  try {
    const keys = getStorageKeys();
    // Don't save photo data URLs to localStorage (they're huge)
    const leadsWithoutPhotos = leads.map((lead) => ({
      ...lead,
      photos: lead.photos?.map((p) => ({ id: p.id, name: p.name })) || [],
    }));
    localStorage.setItem(keys.LEADS, JSON.stringify(leadsWithoutPhotos));
  } catch (err) {
    console.warn("Could not save leads to localStorage:", err);
  }
}

export function loadLeads() {
  try {
    const keys = getStorageKeys();
    const saved = localStorage.getItem(keys.LEADS);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn("Could not load leads from localStorage:", err);
    return null;
  }
}
