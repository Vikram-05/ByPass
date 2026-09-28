import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Crosshair,
  MapPin,
  Search,
  Locate,
  X,
  Navigation,
  Loader2,
} from "lucide-react";

/* --------------------------------------------------------------------- */
/* Custom pin icon                                                       */
/* --------------------------------------------------------------------- */
const pinIcon = new L.DivIcon({
  html: `
    <div style="
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      background:#f59e0b;transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,.28);border:3px solid #fff;
    "></div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

/* --------------------------------------------------------------------- */
/* Map helpers                                                           */
/* --------------------------------------------------------------------- */
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng, { fromClick: true });
    },
  });
  return null;
}

function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.flyTo([lat, lng], zoom ?? map.getZoom(), { duration: 0.6 });
    }
    // eslint-disable-next-line
  }, [lat, lng, zoom]);
  return null;
}

/* --------------------------------------------------------------------- */
/* Nominatim helpers                                                     */
/* --------------------------------------------------------------------- */
async function searchPlaces(query, signal) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "6",
    });
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

async function reverseGeocode(lat, lng) {
  try {
    const url =
      "https://nominatim.openstreetmap.org/reverse?" +
      new URLSearchParams({
        lat,
        lon: lng,
        format: "json",
        zoom: "18",
        addressdetails: "1",
      });
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

/* --------------------------------------------------------------------- */
/* Main component                                                        */
/* --------------------------------------------------------------------- */
export default function MapPicker({ value, onChange }) {
  // value = { latitude, longitude, address }
  const [address, setAddress] = useState(value?.address || "");

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coordInput, setCoordInput] = useState({
    lat: value?.latitude ?? "",
    lng: value?.longitude ?? "",
  });
  const [coordError, setCoordError] = useState("");

  // For focus / zoom control
  const [focus, setFocus] = useState(null); // { lat, lng, zoom }
  const [fetchingAddress, setFetchingAddress] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  /* ---------------- Sync external value ---------------- */
  useEffect(() => {
    setAddress(value?.address || "");
    setCoordInput({
      lat: value?.latitude ?? "",
      lng: value?.longitude ?? "",
    });
  }, [value?.address, value?.latitude, value?.longitude]);

  /* ---------------- Debounced search ---------------- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const data = await searchPlaces(q, controller.signal);
        setSuggestions(data || []);
      } catch (e) {
        if (e.name !== "AbortError") setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  /* ---------------- Apply a picked location ---------------- */
  const applyLocation = async (lat, lng, { addressHint } = {}) => {
    setFocus({ lat, lng, zoom: 17 });
    setFetchingAddress(!addressHint);
    const addr = addressHint || (await reverseGeocode(lat, lng));
    setAddress(addr);
    setCoordInput({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    onChange?.({ latitude: lat, longitude: lng, address: addr });
    setFetchingAddress(false);
  };

  /* ---------------- Map click ---------------- */
  const handleMapPick = (lat, lng) => {
    applyLocation(lat, lng);
  };

  /* ---------------- Suggestion select ---------------- */
  const handleSuggestion = (s) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setQuery(s.display_name);
    setShowSuggestions(false);
    applyLocation(lat, lng, { addressHint: s.display_name });
  };

  /* ---------------- My location ---------------- */
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await applyLocation(latitude, longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ---------------- Lat/Lng manual ---------------- */
  const handleCoordGo = () => {
    setCoordError("");
    const lat = parseFloat(coordInput.lat);
    const lng = parseFloat(coordInput.lng);
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setCoordError("Enter valid latitude (-90..90) and longitude (-180..180).");
      return;
    }
    applyLocation(lat, lng);
  };

  /* ---------------- Center for the map ---------------- */
  const center = useMemo(
    () => ({
      lat: value?.latitude || 13.0899,
      lng: value?.longitude || 77.5462,
    }),
    [value?.latitude, value?.longitude]
  );

  return (
    <div className="space-y-3">
      {/* Label + top actions */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-ink-600 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Pick location
        </label>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-ink-900 text-white hover:bg-ink-800 disabled:opacity-60 transition"
        >
          {locating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Locating…
            </>
          ) : (
            <>
              <Crosshair className="w-3 h-3" />
              Use my location
            </>
          )}
        </button>
      </div>

      {/* Search input + suggestions */}
      <div className="relative z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() =>
              // delay so clicks register
              setTimeout(() => setShowSuggestions(false), 180)
            }
            placeholder="Search a place, landmark, or address…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white ring-1 ring-ink-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-ink-50 transition"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5 text-ink-400" />
            </button>
          )}
          {searching && (
            <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 animate-spin" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl ring-1 ring-ink-100 shadow-lg max-h-72 overflow-auto animate-fade-up">
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestion(s)}
                className="w-full text-left px-3 py-2.5 hover:bg-ink-50 border-b border-ink-50 last:border-0 transition"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-ink-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-900 line-clamp-1">
                      {s.display_name.split(",")[0]}
                    </p>
                    <p className="text-[11px] text-ink-500 line-clamp-2 mt-0.5">
                      {s.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="h-64 rounded-xl overflow-hidden ring-1 ring-ink-100 relative z-0">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handleMapPick} />
          {focus && (
            <Recenter lat={focus.lat} lng={focus.lng} zoom={focus.zoom} />
          )}
          {value?.latitude && value?.longitude && (
            <Marker
              position={[value.latitude, value.longitude]}
              icon={pinIcon}
            />
          )}
        </MapContainer>

        {fetchingAddress && (
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg ring-1 ring-ink-100 flex items-center gap-2 text-[11px] text-ink-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Fetching address…
          </div>
        )}
      </div>

      {/* Manual lat/lng */}
      <div className="bg-ink-50 rounded-xl ring-1 ring-ink-100 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Navigation className="w-3.5 h-3.5 text-ink-500" />
          <p className="text-[11px] font-medium text-ink-600">
            Or enter coordinates directly
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            inputMode="decimal"
            value={coordInput.lat}
            onChange={(e) =>
              setCoordInput((s) => ({ ...s, lat: e.target.value }))
            }
            placeholder="Latitude   e.g. 13.089907"
            className="w-full px-3 py-2 rounded-lg bg-white ring-1 ring-ink-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
          <input
            inputMode="decimal"
            value={coordInput.lng}
            onChange={(e) =>
              setCoordInput((s) => ({ ...s, lng: e.target.value }))
            }
            placeholder="Longitude  e.g. 77.546225"
            className="w-full px-3 py-2 rounded-lg bg-white ring-1 ring-ink-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        {coordError && (
          <p className="text-[11px] text-rose-600 mt-1.5">{coordError}</p>
        )}
        <button
          type="button"
          onClick={handleCoordGo}
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition"
        >
          <Locate className="w-3 h-3" />
          Locate
        </button>
      </div>

      {/* Selected address */}
      <div className="bg-ink-50 rounded-xl p-3 ring-1 ring-ink-100">
        <p className="text-[11px] text-ink-500 mb-1">Selected address</p>
        <p className="text-xs text-ink-800 font-medium break-words">
          {address || "Search, click the map, use GPS, or enter coordinates."}
        </p>
        {value?.latitude && value?.longitude && (
          <p className="text-[10px] font-mono text-ink-400 mt-1">
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
}