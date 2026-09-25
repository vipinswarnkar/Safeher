import { HiOutlineMapPin } from "react-icons/hi2";
import { useState , useEffect} from "react";
import toast from "react-hot-toast";
import api from "../services/api";

function StartJourneyCard({activeJourney, onJourneyStarted}) {

  const [destination, setDestination] = useState("");

  const [selectedPlace, setSelectedPlace] = useState(null);

  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState([]);

  const [searching, setSearching] = useState(false);

  useEffect(() => {

    // Don't search for short text, or right after the user picked a suggestion
    if (destination.length < 3 || selectedPlace) {

        return;

    }

    const timer = setTimeout(async () => {

        try {

            setSearching(true);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=5`
            );

            const data = await response.json();

            setSuggestions(data);

        } catch (error) {

            console.log(error);

        } finally {

            setSearching(false);

        }

    }, 400);

    return () => clearTimeout(timer);

}, [destination, selectedPlace]);

  // Only show results that match what's typed right now
  const showSuggestions =
    !selectedPlace && destination.length >= 3 && suggestions.length > 0;

  const handleStartJourney = async () => {

   if (!selectedPlace) {

    toast.error("Please select a destination from the suggestions.");

    return;

}

    try {

        setLoading(true);

        // Current position as the journey's start point (optional)
        let sourceLocation;
        try {
            const position = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 8000,
                })
            );
            sourceLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
        } catch {
            sourceLocation = undefined;
        }

        await api.post("/journey/start", {
            source: "Current Location",
            destination: selectedPlace.display_name,
            sourceLocation,
            destinationLocation: {
                latitude: Number(selectedPlace.lat),
                longitude: Number(selectedPlace.lon),
            },
        });

        toast.success("Journey started. Stay safe!");

        setDestination("");
        setSelectedPlace(null);

        if (onJourneyStarted) {
            onJourneyStarted();
        }

        } catch (error) {

            console.log(error.response?.data || error);

            toast.error(error.response?.data?.message || "Unable to start journey");

        } finally {

            setLoading(false);

        }

};

const handleEndJourney = async () => {
  try {

    setLoading(true);

    await api.patch(`/journey/end/${activeJourney._id}`);

    toast.success("Journey ended");

    if (onJourneyStarted) {
      onJourneyStarted();
    }

  } catch (error) {

    console.log(error.response?.data || error);

    toast.error(error.response?.data?.message || "Unable to end journey");

  } finally {

    setLoading(false);

  }
};

if (activeJourney) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-5 space-y-4">

      <p className="text-green-600 font-semibold">
        Journey Active
      </p>

      <h2 className="text-xl font-bold">
        {activeJourney.destination}
      </h2>

      <p className="text-sm text-slate-500">
        Started at{" "}
        {new Date(activeJourney.startedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <button
        onClick={handleEndJourney}
        disabled={loading}
        className="w-full bg-red-500 text-white py-3 rounded-2xl font-semibold"
    >
        {loading ? "Ending..." : "End Journey"}
      </button>

    </div>
  );
}

  return (

    <div className="bg-white rounded-3xl shadow-lg p-5 space-y-4">

      <div>

        <p className="text-xs text-slate-500">
          Current Location
        </p>

        <h3 className="font-semibold text-slate-900">
          Detect Automatically
        </h3>

      </div>

      <div>

        <label className="text-xs text-slate-500">
          Destination
        </label>

        <div className="relative mt-2">

          <HiOutlineMapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600"
            size={20}
          />

          <input
            type="text"
            placeholder="Where are you going?"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              // Typing again means the earlier pick no longer applies
              setSelectedPlace(null);
            }}
            className="
            w-full
            rounded-2xl
            border
            border-slate-200
            py-3
            pl-11
            pr-4
            outline-none
            focus:ring-2
            focus:ring-rose-500
            "
          />

          {searching && (
            <p className="text-xs text-slate-500 mt-2">
                Searching...
            </p>
        )}

        {showSuggestions && (
            <div className="mt-2 bg-white border rounded-2xl shadow max-h-60 overflow-y-auto">

                {suggestions.map((place) => (

                    <button
                        key={place.place_id}
                        type="button"
                      onClick={() => {

                          setDestination(place.display_name);

                          setSelectedPlace(place);

                          setSuggestions([]);

                      }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-100 border-b last:border-none"
                    >
                        📍 {place.display_name}
                    </button>

                ))}

            </div>
        )}

        </div>

      </div>

      <button
        type="button"
        onClick={handleStartJourney}
        disabled={loading}
        className="
        w-full
        bg-rose-600
        text-white
        rounded-2xl
        py-3
        font-semibold
        hover:bg-rose-700
        transition
        "
      >
        {loading ? "Starting..." : "Start Journey"}
      </button>

    </div>

  );
}



export default StartJourneyCard;