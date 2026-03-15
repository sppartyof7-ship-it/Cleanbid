import { useEffect, useRef, useState } from "react";

/**
 * Address input with Google Places Autocomplete.
 * Uses the NEW PlaceAutocompleteElement API (required for accounts created after March 2025).
 * Loads the Places library via importLibrary() as required by the new API.
 * Falls back to a plain text input if no API key is configured.
 */
export default function AddressAutocomplete({ value, onChange, style, placeholder, apiKey }) {
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [useFallback, setUseFallback] = useState(!apiKey);

  // Load Google Maps core script, then import Places library & create element
  useEffect(() => {
    if (!apiKey) {
      setUseFallback(true);
      return;
    }
    if (autocompleteRef.current) return; // Already initialized

    let cancelled = false;

    async function init() {
      try {
        // Step 1: Load the Google Maps core script if not already present
        if (!window.google?.maps) {
          await new Promise((resolve, reject) => {
            // Check if script is already being loaded
            if (document.querySelector('script[src*="maps.googleapis.com"]')) {
              // Wait for it to finish loading
              const check = setInterval(() => {
                if (window.google?.maps) {
                  clearInterval(check);
                  resolve();
                }
              }, 100);
              return;
            }
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (cancelled) return;

        // Step 2: Import the Places library using the new importLibrary method
        const placesLib = await window.google.maps.importLibrary("places");

        if (cancelled || !containerRef.current) return;

        // Step 3: Create the PlaceAutocompleteElement
        const placeAutocomplete = new placesLib.PlaceAutocompleteElement({
          componentRestrictions: { country: "us" },
          types: ["address"],
        });

        // Style the element to match our form
        placeAutocomplete.style.width = "100%";
        placeAutocomplete.style.boxSizing = "border-box";

        // Listen for place selection (new API uses "gmp-select" event)
        placeAutocomplete.addEventListener("gmp-select", async (event) => {
          const placePrediction = event.placePrediction;
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ["formattedAddress"] });
          if (place.formattedAddress) {
            onChange(place.formattedAddress);
          }
        });

        // Clear the container and append the autocomplete element
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(placeAutocomplete);
          autocompleteRef.current = placeAutocomplete;
        }
      } catch (err) {
        console.warn("PlaceAutocompleteElement not available, using fallback input:", err);
        if (!cancelled) setUseFallback(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [apiKey, onChange]);

  // Fallback: plain text input (no autocomplete)
  if (useFallback) {
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

  // Google Places container — the PlaceAutocompleteElement gets injected here
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        minHeight: "40px",
        ...style,
      }}
    >
      <input
        type="text"
        placeholder="Loading address search..."
        disabled
        style={style}
      />
    </div>
  );
}
