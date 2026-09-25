import { HiOutlinePhone, HiOutlineMap } from "react-icons/hi2";
import { PLACE_STYLES } from "../utils/safety";
import { formatDistance } from "../utils/location";

// List of the closest police stations, hospitals, 24x7 shops...
function NearbySafePlaces({ places, available = true, limit = 5, loading }) {
  if (loading) return <div className="bg-white rounded-3xl shadow p-5 h-32 animate-pulse" />;

  if (!available) {
    return (
      <div className="bg-white rounded-3xl shadow p-5 text-sm text-slate-500">
        The map service for safe places is busy. Try again in a minute.
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow p-5 text-sm text-slate-500">
        No police stations, hospitals or 24x7 places found nearby.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {places.slice(0, limit).map((place) => {
        const style = PLACE_STYLES[place.category] || PLACE_STYLES.fuel;
        return (
          <li key={place.id} className="bg-white rounded-2xl shadow p-3 flex items-center gap-3">
            <div
              className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: `${style.color}1a` }}
            >
              {style.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{place.name}</p>
              <p className="text-xs text-slate-500">
                {style.label} · {formatDistance(place.distanceMeters)}
                {place.open24x7 && " · Open 24x7"}
              </p>
            </div>
            {place.phone && (
              <a href={`tel:${place.phone}`} className="p-2 text-green-600 rounded-full hover:bg-green-50" aria-label={`Call ${place.name}`}>
                <HiOutlinePhone size={18} />
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=walking`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-rose-600 rounded-full hover:bg-rose-50"
              aria-label={`Directions to ${place.name}`}
            >
              <HiOutlineMap size={18} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default NearbySafePlaces;
