import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Address input with Google Places Autocomplete.
 *
 * Strategy:
 * 1. Try the NEW PlaceAutocompleteElement (google.maps.places.PlaceAutocompleteElement)
 * 2. Fall back to the CLASSIC Autocomplete widget (google.maps.places.Autocomplete)
 * 3. If both fail, use a plain <input> as a controlled fallback
 *
 * KEY DESIGN DECISION: When Google is active, the input is UNCONTROLLED.
 * Google's widget manages the <input> directly. We only notify the parent
 * (onChange) when:
 *   1. The user picks a suggestion (place_changed / gmp-placeselect event)
 *   2. The user leaves the field (onBlur)
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
    script.src = `https://maps.googleapis.com/maps/api/js?libraries=places&key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => { loadPromise = null; reject(new Error("Google Maps failed")); };
    document.head.appendChild(script);
  });
  return loadPromise;
}

/**
 * Try to geocode a partial address to get the full formatted address.
 * This catches the case where users type without selecting a suggestion.
 */
async function geocodeAddress(address, apiKey) {
  if (!address || address.length < 5) return null;
  // If it already looks like a full address (has a comma = likely has city), skip
  if (address.includes(",")) return null;

  try {
    if (!window.google?.maps?.Geocoder) return null;
    const geocoder = new window.google.maps.Geocoder();
    const result = await new Promise((resolve, reject) => {
      geocoder.geocode(
        { address, componentRestrictions: { country: "US" } },
        (results, status) => {
          if (status === "OK" && results?.[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error(status));
          }
        }
      );
    });
    return result;
  } catch {
    return null;
  }
}

export default function AddressAutocomplete({ value, onChange, style, placeholder, apiKey }) {
  const key = apiKey || MAPS_KEY;
  const inputRef = useRef(null);
  const acRef = useRef(null);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const [fallback, setFallback] = useState(!key);
  const [selectedFromGoogle, setSelectedFromGoogle] = useState(false);

  // Geocode on blur if user typed manually (didn't pick a suggestion)
  const handleBlur = useCallback(async (e) => {
    const typed = e.target.value;
    cbRef.current(typed);

    // If user selected from Google suggestions, the address is already complete
    if (selectedFromGoogle) {
      setSelectedFromGoogle(false);
      return;
    }

    // Try to geocode the partial address to get a full one
    if (typed && !typed.includes(",") && key) {
      const full = await geocodeAddress(typed, key);
      if (full && full !== typed) {
        cbRef.current(full);
        // Update the input display too
        if (inputRef.current) {
          inputRef.current.value = full;
        }
      }
    }
  }, [key, selectedFromGoogle]);

  // Load Google Maps + attach Autocomplete (runs once)
  useEffect(() => {
    if (!key) return;
    let dead = false;

    (async () => {
      try {
        await loadGoogleMaps(key);
        if (dead || !inputRef.current || acRef.current) return;

        // Use the classic Autocomplete widget
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "us" },
          types: ["address"],
          fields: ["formatted_address"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (place?.formatted_address) {
            setSelectedFromGoogle(true);
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

  // z-index fix for the dropdown (Google's pac-container)
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
        placeholder={placeholder || "123 Main St, City, ST 12345"}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        autoComplete="street-address"
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
      onBlur={handleBlur}
      style={style}
      autoComplete="off"
    />
  );
}
