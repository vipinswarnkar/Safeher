import { useEffect, useState } from "react";
import { HiOutlineMapPin, HiOutlineXMark } from "react-icons/hi2";

/*
 * Place search using OpenStreetMap's Nominatim (free).
 * Calls onSelect({ name, latitude, longitude }) when a suggestion is picked.
 */
function DestinationSearch({ selected, onSelect, near }) {
  const [query, setQuery] = useState(selected?.name || "");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Don't search for short text, or right after the user picked a suggestion
    if (query.length < 3 || selected) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const params = new URLSearchParams({ format: "json", q: query, limit: "5", countrycodes: "in" });
        // Prefer results near the user
        if (near) {
          const d = 0.5;
          params.set(
            "viewbox",
            `${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}`
          );
        }
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
        });
        setSuggestions(await response.json());
      } catch (error) {
        if (error.name !== "AbortError") console.log(error);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected, near]);

  const showSuggestions = !selected && query.length >= 3 && suggestions.length > 0;

  return (
    <div>
      <label className="text-xs text-slate-500">Destination</label>
      <div className="relative mt-2">
        <HiOutlineMapPin className="absolute left-4 top-3.5 text-rose-600" size={20} />
        <input
          type="text"
          placeholder="Where are you going?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Typing again means the earlier pick no longer applies
            if (selected) onSelect(null);
          }}
          className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-10 outline-none focus:ring-2 focus:ring-rose-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onSelect(null);
            }}
            className="absolute right-3 top-3 text-slate-400"
            aria-label="Clear destination"
          >
            <HiOutlineXMark size={20} />
          </button>
        )}

        {searching && <p className="text-xs text-slate-500 mt-2">Searching...</p>}

        {showSuggestions && (
          <div className="mt-2 bg-white border rounded-2xl shadow max-h-60 overflow-y-auto">
            {suggestions.map((place) => (
              <button
                key={place.place_id}
                type="button"
                onClick={() => {
                  setQuery(place.display_name);
                  setSuggestions([]);
                  onSelect({
                    name: place.display_name,
                    latitude: Number(place.lat),
                    longitude: Number(place.lon),
                  });
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-100 border-b last:border-none text-sm"
              >
                📍 {place.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DestinationSearch;
