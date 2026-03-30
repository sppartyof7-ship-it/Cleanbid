import { useEffect, useRef, useState } from "react";

/**
 * Address input with Google Places Autocomplete.
 * Uses the NEW PlaceAutocompleteElement API (required for accounts created after March 2025).
 * Uses Google's Dynamic Library Import bootstrap to load importLibrary().
 * Falls back to a plain text input if no API key is configured.
 */

// Initialize the Google Maps bootstrap loader (sets up importLibrary)
function initGoogleMapsLoader(apiKey) {
  if (window.google?.maps?.importLibrary) return; // Already initialized

  ((g) => {
    var h,
      a,
      k,
      p = "The Google Maps JavaScript API",
      c = "google",
      l = "importLibrary",
      q = "__ib__",
      m = document,
      b = window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {}),
      r = new Set(),
      e = new URLSearchParams(),
      u = () =>
        h ||
        (h = new Promise(async (f, n) => {
          await (a = m.createElement("script"));
          e.set("libraries", [...r] + "");
          for (k in g)
            e.set(
              k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
              g[k]
            );
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.googleapis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => (h = n(Error(p + " could not load.")));
          a.nonce = m.querySelector("script[nonce]")?.nonce || "";
          m.head.append(a);
        }));
    d[l]
      ? console.warn(p + " only loads once. Ignoring:", g)
      : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
  })({ key: apiKey, v: "beta" });
}

const FALLBACK_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAnLy1iRt0_fkMJqyBxrC0meEJD0qpshvU";

export default function AddressAutocomplete({ value, onChange, style, placeholder, apiKey }) {
  const resolvedKey = apiKey || FALLBACK_KEY;
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [useFallback, setUseFallback] = useState(!resolvedKey);

  useEffect(() => {
    if (!resolvedKey) {
      setUseFallback(true);
      return;
    }
    if (autocompleteRef.current) return; // Already initialized

    let cancelled = false;

    async function init() {
      try {
        // Step 1: Initialize the Google Maps bootstrap loader
        initGoogleMapsLoader(resolvedKey);

        if (cancelled) return;

        // Step 2: Import the Places library using importLibrary
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
  }, [resolvedKey, onChange]);

  // Fix mobile: ensure Google Places dropdown renders above everything
  useEffect(() => {
    const styleId = "gmp-autocomplete-fix";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        .pac-container, gmp-place-autocomplete { z-index: 99999 !important; }
        gmp-place-autocomplete input { font-size: 16px !important; }
      `;
      document.head.appendChild(s);
    }
  }, []);

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
