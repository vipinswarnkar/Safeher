import { useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineSparkles } from "react-icons/hi2";

import api from "../services/api";
import DestinationSearch from "./DestinationSearch";
import { getCurrentPosition, downsampleRoute, formatDistance, formatMinutes } from "../utils/location";
import { LEVEL_STYLES } from "../utils/safety";

/*
 * Pick a destination -> compare route options by safety -> start the journey.
 * The parent draws the routes on the map (routes, selectedIndex via callbacks).
 */
function RoutePlanner({ position, onRoutesChange, onDestinationChange, onStarted }) {
  const [destination, setDestination] = useState(null);
  const [mode, setMode] = useState("foot");
  const [plan, setPlan] = useState(null); // { routes, recommendedIndex, reason, ... }
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routesFailed, setRoutesFailed] = useState(false);
  const [starting, setStarting] = useState(false);

  const updateSelection = (index, routes) => {
    setSelectedIndex(index);
    onRoutesChange?.(routes, index);
  };

  const pickDestination = (place) => {
    setDestination(place);
    setPlan(null);
    setRoutesFailed(false);
    onRoutesChange?.(null, 0);
    onDestinationChange?.(place);
  };

  const findRoutes = async (travelMode = mode) => {
    if (!destination) return;
    try {
      setLoadingRoutes(true);
      setRoutesFailed(false);
      const from = position || (await getCurrentPosition());
      const { data } = await api.get("/safety/routes", {
        params: {
          fromLat: from.latitude,
          fromLng: from.longitude,
          toLat: destination.latitude,
          toLng: destination.longitude,
          mode: travelMode,
        },
      });
      setPlan(data);
      updateSelection(Math.max(0, data.recommendedIndex), data.routes);
    } catch (error) {
      setPlan(null);
      setRoutesFailed(true);
      onRoutesChange?.(null, 0);
      toast.error(error.response?.data?.message || "Couldn't find routes. You can still start the journey.");
    } finally {
      setLoadingRoutes(false);
    }
  };

  const startJourney = async () => {
    if (!destination) {
      toast.error("Please select a destination from the suggestions.");
      return;
    }

    try {
      setStarting(true);
      let from = position;
      if (!from) {
        try {
          from = await getCurrentPosition({ timeout: 8000 });
        } catch {
          from = null;
        }
      }

      const route = plan?.routes?.[selectedIndex];
      await api.post("/journey/start", {
        source: "Current Location",
        destination: destination.name,
        sourceLocation: from ? { latitude: from.latitude, longitude: from.longitude } : undefined,
        destinationLocation: { latitude: destination.latitude, longitude: destination.longitude },
        ...(route && {
          plannedRoute: downsampleRoute(route.coordinates, 500),
          expectedDurationSec: route.durationSec,
          routeSafetyScore: route.safetyScore,
        }),
      });

      toast.success("Journey started. Share your live link with someone you trust.");
      setPlan(null);
      setDestination(null);
      onRoutesChange?.(null, 0);
      onDestinationChange?.(null);
      onStarted?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to start journey");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-5 space-y-4">
      <DestinationSearch selected={destination} onSelect={pickDestination} near={position} />

      {destination && (
        <div className="flex gap-2">
          {[
            { id: "foot", label: "🚶 Walking" },
            { id: "driving", label: "🚗 Cab / Drive" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                if (plan) findRoutes(m.id);
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                mode === m.id ? "bg-rose-50 border-rose-500 text-rose-700" : "border-slate-200 text-slate-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {destination && !plan && (
        <button
          type="button"
          onClick={() => findRoutes()}
          disabled={loadingRoutes}
          className="w-full flex items-center justify-center gap-2 border-2 border-rose-600 text-rose-700 py-3 rounded-2xl font-semibold hover:bg-rose-50 disabled:opacity-60"
        >
          <HiOutlineSparkles size={20} />
          {loadingRoutes ? "Checking routes for safety..." : "Find the safest route"}
        </button>
      )}

      {plan && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            {plan.routes.length} route{plan.routes.length > 1 ? "s" : ""} found
            {plan.isNight && " · night-time scoring"}
          </p>

          {plan.routes.map((route, index) => {
            const style = LEVEL_STYLES[route.level];
            const selected = index === selectedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => updateSelection(index, plan.routes)}
                className={`w-full text-left rounded-2xl border-2 p-3 transition ${
                  selected ? "border-rose-500 bg-rose-50" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatMinutes(route.durationSec)}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        · {formatDistance(route.distanceMeters)}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {index === plan.recommendedIndex && (
                        <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                      {index === plan.fastestIndex && (
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Fastest
                        </span>
                      )}
                      {route.riskyStretches > 0 && (
                        <span className="text-[11px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          {route.riskyStretches} risky spot{route.riskyStretches > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`text-center px-3 py-1 rounded-xl ${style.bg}`}>
                    <p className={`text-lg font-bold ${style.text}`}>{route.safetyScore}</p>
                    <p className={`text-[10px] ${style.text}`}>safety</p>
                  </div>
                </div>
              </button>
            );
          })}

          {plan.reason && plan.routes.length > 1 && (
            <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2">💡 {plan.reason}</p>
          )}
          {!plan.placesAvailable && (
            <p className="text-[11px] text-slate-400">
              Safe-places data was unavailable, so scores use community reports and time of day only.
            </p>
          )}
        </div>
      )}

      {routesFailed && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-2">
          Route suggestions aren't available right now. You can still start the journey. Tracking and
          alerts will work, but without off-route checks.
        </p>
      )}

      <button
        type="button"
        onClick={startJourney}
        disabled={starting || !destination || loadingRoutes}
        className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-2xl py-3 font-semibold transition"
      >
        {starting ? "Starting..." : plan ? "Start journey on this route" : "Start journey"}
      </button>
    </div>
  );
}

export default RoutePlanner;
