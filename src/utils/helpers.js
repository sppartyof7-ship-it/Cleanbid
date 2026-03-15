// Format a number as currency: $1,234
export const fmt = (n) =>
  "$" +
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Deep clone an object (simple & effective for JSON-safe data)
export const deepClone = (o) => JSON.parse(JSON.stringify(o));

// Validate email format
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validate phone (at least 10 digits)
export const isValidPhone = (phone) =>
  phone.replace(/\D/g, "").length >= 10;
