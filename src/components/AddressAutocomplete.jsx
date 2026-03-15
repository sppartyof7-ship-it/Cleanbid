import { useEffect, useRef, useState } from "react";

/**
 * Address input with Google Places Autocomplete.
 * Falls back to a plain text input if no API key is configured.
 */
export default function AddressAutocomplete({ value, onChange, style, placeholder, apiKey }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Load Google Maps script if we have an API key and it isn't loaded yet
  useEffect(() => {
    if (!apiKey || window.google?.maps?.places) {
      if (window.google?.maps?.places) setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove — other components might need it
    };
  }, [apiKey]);

  // Initialize autocomplete once script is loaded
  useEffect(() => {
    if (!loaded || !inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return; // Already initialized

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["formatted_address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    autocompleteRef.current = ac;
  }, [loaded, onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder || "123 Main St, City, ST"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={style}
      autoComplete="off"
    />
  );
}
