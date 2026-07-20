import { HiOutlineMapPin } from "react-icons/hi2";
import { useState } from "react";
import api from "../services/api";

function StartJourneyCard(activeJourney, onJourneyStarted) {

  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStartJourney = async () => {

    if (!destination.trim()) {
        alert("Please enter destination");
        return;
    }

    try {

        setLoading(true);

        const token = localStorage.getItem("token");

        const response = await api.post(
            "/journey/start",
            {
                source: "Current Location",
                destination: destination,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log(response.data);

        setDestination("");

        if (onJourneyStarted) {
            onJourneyStarted();
        }

        } catch (error) {

            console.log(error.response?.data || error);

            alert(error.response?.data?.message || "Unable to start journey");

        } finally {

            setLoading(false);

        }

};

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
            onChange={(e) => setDestination(e.target.value)}
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