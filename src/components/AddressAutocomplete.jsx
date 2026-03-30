import { useEffect, useRef, useState } from "react";

/**
 * Address input with Google Places Autocomplete (classic widget).
 *
 * KEY DESIGN DECISION: This input is fully UNCONTROLLED when Google is active.
 * Google's Autocomplete widget manages the <input> directly.
 * We only notify the parent (onChange) when:
 *   1. The user picks a suggestion (place_changed event)
 *   2. The user leaves the field (onBlur)
 * This prevents React re-renders from fighting with Google.
 */

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAnLy1iRt0_fkMJqyBxrC0meEJD0qpshvU";

let loadPromise = null;
function loadGoogleMaps(apiKey) {
  if (loadPromise) return loadPromise;
  if (window.google?.maps?.places) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?libraries=places&key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => { loadPromise = null; reject(new Error("Google Maps failed")); };
    document.head.appendChild(script);
  });
  return loadPromise;
}

export default function AddressAutocomplete({ value, onChange, style, placeholder, apiKey }) {
  const key = apiKey || MAPS_KEY;
  const inputRef = useRef(null);
  const acRef = useRef(null);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const [fallback, setFallback] = useState(!key);

  // Load Google Maps + attach Autocomplete (runs once)
  useEffect(() => {
    if (!key) return;
    let dead = false;

    (async () => {
      try {
        await loadGoogleMaps(key);
        if (dead || !inputRef.current || acRef.current) return;

        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "us" },
          types: ["address"],
          fields: ["formatted_address"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (place?.formatted_address) {
            cbRef.current(place.formatted_address);
          }
        });

        acRef.current = ac;
      } catch {
        if (!dead) setFallback(true);
      }
    })();

    return () => { dead = true; };
  }, [key]);

  // z-index fix for the dropdown
  useEffect(() => {
    if (!document.getElementById("pac-fix")) {
      const s = document.createElement("style");
      s.id = "pac-fix";
      s.textContent = ".pac-container{z-index:99999!important}";
      document.head.appendChild(s);
    }
  }, []);

  // Controlled fallback (no Google)
  if (fallback) {
    return (
      <input
        type="text"
        placeholder={placeholder || "123 Main St, City, ST"}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        autoComplete="off"
      />
    );
  }

  // Uncontrolled Google input — NO value prop, NO onChange per-keystroke
  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder || "Start typing an address..."}
      defaultValue={value || ""}
      onBlur={(e) => cbRef.current(e.target.value)}
      style={style}
      autoComplete="off"
    />
  );
}
