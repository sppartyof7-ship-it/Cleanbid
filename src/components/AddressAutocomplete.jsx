import { useEffect, useRef, useState } from "react";

/**
 * Address input with Google Places Autocomplete.
 * Uses the NEW PlaceAutocompleteElement API (required for accounts created after March 2025).
 * Falls back to a plain text input if no API key is configured.
 */
export default function AddressAutocomplete({ value, onChange, style, placeholder, apiKey }) {
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(!apiKey);

  // Load Google Maps script if we have an API key and it isn't loaded yet
  useEffect(() => {
    if (!apiKey) {
      setUseFallback(true);
      return;
    }

    // Already loaded
    if (window.google?.maps?.places) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setUseFallback(true);
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize the new PlaceAutocompleteElement once script is loaded
  useEffect(() => {
    if (!loaded || !containerRef.current || useFallback) return;
    if (autocompleteRef.current) return; // Already initialized

    try {
      // Create the new PlaceAutocompleteElement
      const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: "us" },
        types: ["address"],
      });

      // Style the element to match our form
      placeAutocomplete.style.width = "100%";
      placeAutocomplete.style.boxSizing = "border-box";

      // Listen for place selection
      placeAutocomplete.addEventListener("gmp-placeselect", async (event) => {
        const place = event.place;
        // Fetch the full place details
        await place.fetchFields({ fields: ["formattedAddress"] });
        if (place.formattedAddress) {
          onChange(place.formattedAddress);
        }
      });

      // Clear the container and append the autocomplete element
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(placeAutocomplete);
      autocompleteRef.current = placeAutocomplete;
    } catch (err) {
      console.warn("PlaceAutocompleteElement not available, using fallback input:", err);
      setUseFallback(true);
    }
  }, [loaded, useFallback, onChange]);

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
      {/* Loading state while Google Maps script loads */}
      {!loaded && (
        <input
          type="text"
          placeholder="Loading address search..."
          disabled
          style={style}
        />
      )}
    </div>
  );
}
