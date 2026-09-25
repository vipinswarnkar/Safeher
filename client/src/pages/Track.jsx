import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { HiOutlinePhone, HiOutlineClock, HiOutlineCheckCircle } from "react-icons/hi2";

import api from "../services/api";
import { createSocket } from "../services/socket";
import SafeMap from "../components/SafeMap";
import { formatTime, shortPlace } from "../utils/format";

const POLL_MS = 20000;

function timeAgo(date, now) {
  if (!date) return "";
  const sec = Math.max(0, Math.round((now - new Date(date)) / 1000));
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  return `${Math.round(min / 60)} h ago`;
}

/*
 * Public live-tracking page (no login). Trusted contacts open this link.
 * Gets live updates over Socket.IO and falls back to polling every 20 s.
 */
function Track() {
  const { token } = useParams();
  const [journey, setJourney] = useState(null);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Initial load + polling fallback
  useEffect(() => {
    let cancelled = false;

    const load = () =>
      api
        .get(`/track/${token}`)
        .then(({ data }) => !cancelled && setJourney(data.journey))
        .catch((err) => !cancelled && setError(err.response?.data?.message || "Couldn't load this link"));

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token]);

  // Realtime updates
  useEffect(() => {
    const socket = createSocket();

    socket.on("connect", () => {
      socket.emit("track:join", token, (res) => setLive(Boolean(res?.ok)));
    });
    socket.on("disconnect", () => setLive(false));

    socket.on("track:location", (point) => {
      setJourney((j) =>
        j
          ? {
              ...j,
              latest: { latitude: point.latitude, longitude: point.longitude, createdAt: point.at },
              path: [...(j.path || []), [point.longitude, point.latitude]],
            }
          : j
      );
    });

    socket.on("track:status", (status) => setJourney((j) => (j ? { ...j, ...status } : j)));
    socket.on("track:checkin", ({ at }) => setJourney((j) => (j ? { ...j, lastCheckInAt: at } : j)));

    return () => socket.disconnect();
  }, [token]);

  // Keep "x min ago" fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const latest = journey?.latest;
  const position = useMemo(
    () => (latest ? { latitude: latest.latitude, longitude: latest.longitude } : null),
    [latest]
  );

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow p-8 text-center max-w-sm">
          <p className="text-4xl">🔗</p>
          <h1 className="text-lg font-bold mt-3">Link not available</h1>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!journey) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading live location...</div>;
  }

  const isActive = journey.status === "active";
  const stale = isActive && journey.latest && now - new Date(journey.latest.createdAt) > 5 * 60 * 1000;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-md mx-auto px-5 py-6 space-y-5">
        <div>
          <p className="text-xs font-semibold text-rose-600">SafeHer live tracking</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {isActive ? `${journey.name} is on the way` : `${journey.name}'s journey has ended`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">To {shortPlace(journey.destination)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isActive ? (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full bg-green-500 ${live ? "animate-pulse" : ""}`} />
              {live ? "Live" : "Updating every 20 s"}
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-200 text-slate-700">
              Ended {journey.endedAt ? formatTime(journey.endedAt) : ""}
            </span>
          )}
          {journey.expectedArrival && isActive && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-slate-700 flex items-center gap-1">
              <HiOutlineClock size={14} /> ETA {formatTime(journey.expectedArrival)}
            </span>
          )}
          {journey.lastCheckInAt && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-green-700 flex items-center gap-1">
              <HiOutlineCheckCircle size={14} /> Said "I'm OK" {timeAgo(journey.lastCheckInAt, now)}
            </span>
          )}
        </div>

        {journey.expired ? (
          <div className="bg-white rounded-3xl shadow p-6 text-sm text-slate-600">
            This journey finished a while ago, so the location is no longer shown.
          </div>
        ) : (
          <>
            <SafeMap
              position={position}
              path={journey.path}
              plannedRoute={journey.plannedRoute}
              destination={journey.destinationLocation}
              follow
              fitToRoutes={false}
              height={380}
            />
            <p className="text-xs text-slate-500">
              {journey.latest
                ? `Last updated ${timeAgo(journey.latest.createdAt, now)}`
                : "Waiting for the first location update..."}
            </p>
          </>
        )}

        {stale && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-800">
            No update for over 5 minutes. Her phone may be offline. Try calling her.
          </div>
        )}

        <a
          href="tel:112"
          className="flex items-center justify-center gap-2 w-full bg-red-600 text-white py-3 rounded-2xl font-bold"
        >
          <HiOutlinePhone size={20} /> Call 112 (Emergency)
        </a>
      </div>
    </div>
  );
}

export default Track;
