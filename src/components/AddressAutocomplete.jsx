import { useEffect, useRef, useState } from "react";

/**
 * Address input with Google Places Autocomplete.
 * Uses the classic google.maps.places.Autocomplete widget.
 * IMPORTANT: This is an UNCONTROLLED input — Google's Autocomplete
 * manages the input value directly. React only reads it on change/select.
 * Falls back to a plain text input if no API key is configured.
 */

const FALLBACK_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAnLy1iRt0_fkMJqyBxrC0meEJD0qpshvU";

// Load the Google Maps script once
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
    script.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export default function AddressAutocomplete({ value, onChange, style, placeholder, apiKey }) {
  const resolvedKey = apiKey || FALLBACK_KEY;
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [useFallback, setUseFallback] = useState(!resolvedKey);

  // Stable callback ref so we don't re-init autocomplete when onChange changes
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Set initial value once on mount (uncontrolled)
  useEffect(() => {
    if (inputRef.current && value && !inputRef.current.value) {
      inputRef.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    if (!resolvedKey) {
      setUseFallback(true);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        await loadGoogleMaps(resolvedKey);
        if (cancelled) return;
        setReady(true);
      } catch (err) {
        console.warn("Google Maps failed to load, using fallback input:", err);
        if (!cancelled) setUseFallback(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [resolvedKey]);

  // Attach the classic Autocomplete widget once Maps is ready
  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    try {
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "us" },
        types: ["address"],
        fields: ["formatted_address"],
      });

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place?.formatted_address) {
          onChangeRef.current(place.formatted_address);
        }
      });

      autocompleteRef.current = ac;
    } catch (err) {
      console.warn("Autocomplete widget failed:", err);
      setUseFallback(true);
    }
  }, [ready]);

  // Fix z-index so the dropdown shows above everything
  useEffect(() => {
    const styleId = "pac-container-fix";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `.pac-container { z-index: 99999 !important; }`;
      document.head.appendChild(s);
    }
  }, []);

  // Manual typing handler
  const handleInput = (e) => {
    onChangeRef.current(e.target.value);
  };

  if (useFallback) {
    // Fallback: fully controlled plain text input (no Google)
    return (
      <input
        type="text"
        placeholder={placeholder || "123 Main St, City, ST"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        autoComplete="off"
      />
    );
  }

  // Google Autocomplete: UNCONTROLLED input — no value prop
  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder || "Start typing an address..."}
      defaultValue={value || ""}
      onChange={handleInput}
      style={style}
      autoComplete="off"
    />
  );
}
