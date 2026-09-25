import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api";
import SafeMap from "./SafeMap";
import SafetyCheckModal from "./SafetyCheckModal";
import SOSShareSheet from "./SOSShareSheet";
import useSOS from "../hooks/useSOS";
import { distanceMeters } from "../utils/location";

// When to send a location update to the server:
// - the user moved at least MIN_DISTANCE_METERS (but not more than once per MIN_GAP_MS), or
// - HEARTBEAT_MS passed, so a stationary user still shows as "live".
// Stops the database filling up with duplicate points.
const MIN_GAP_MS = 5000;
const HEARTBEAT_MS = 60000;
const MIN_DISTANCE_METERS = 30;

/*
 * Live map that:
 *  - follows the user's GPS and reports it to the server (for tracking + smart alerts)
 *  - shows "Are you OK?" when the server raises a smart alert, with auto-SOS
 *  - passes any other props (routes, places, reports...) through to SafeMap
 */
function MapCard({ location, onPositionChange, onArrived, ...mapProps }) {
  const [position, setPosition] = useState(
    location ? { latitude: location.latitude, longitude: location.longitude } : null
  );
  const [pendingAlert, setPendingAlert] = useState(null);

  const lastSent = useRef({ time: 0, position: null });
  const arrivedNotified = useRef(null);

  // Keep the latest callbacks in refs so the GPS watcher is set up only once
  const callbacks = useRef({ onPositionChange, onArrived });
  useEffect(() => {
    callbacks.current = { onPositionChange, onArrived };
  });

  const { sendSOS, lastResult, clearResult } = useSOS({ lastKnownLocation: position });

  // Server response to a location update: act on smart alerts
  const handleServerResult = useCallback((data) => {
    if (!data?.journeyId) return;

    for (const alert of data.alerts || []) {
      if (alert.requiresCheckIn) {
        setPendingAlert((current) => current || { ...alert, journeyId: data.journeyId });
      } else {
        toast(alert.message, { icon: "⚠️", duration: 7000 });
      }
    }

    if (data.arrived && arrivedNotified.current !== data.journeyId) {
      arrivedNotified.current = data.journeyId;
      toast.success("Looks like you've arrived! Remember to end your journey.", { duration: 7000 });
      callbacks.current.onArrived?.();
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    const watchId = navigator.geolocation.watchPosition(
      async (gps) => {
        const current = { latitude: gps.coords.latitude, longitude: gps.coords.longitude };
        setPosition(current);
        callbacks.current.onPositionChange?.(current);

        const now = Date.now();
        const previous = lastSent.current;
        const elapsed = now - previous.time;
        const moved =
          !previous.position || distanceMeters(previous.position, current) >= MIN_DISTANCE_METERS;

        if (!((moved && elapsed >= MIN_GAP_MS) || elapsed >= HEARTBEAT_MS)) return;

        lastSent.current = { time: now, position: current };

        try {
          const { data } = await api.post("/location/update", {
            ...current,
            accuracy: gps.coords.accuracy,
            speed: gps.coords.speed,
          });
          handleServerResult(data);
        } catch (error) {
          console.log("Location update failed:", error.message);
        }
      },
      (error) => console.log("GPS error:", error.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [handleServerResult]);

  const handleOk = async () => {
    const alert = pendingAlert;
    setPendingAlert(null);
    try {
      await api.post(`/journey/${alert.journeyId}/check-in`, { alertType: alert.type });
      toast.success("Glad you're safe");
    } catch {
      // Not critical: the alert was already dismissed
    }
  };

  const handleSOS = async (automatic) => {
    setPendingAlert(null);
    if (automatic) toast.error("No response. Sending SOS to your contacts.", { duration: 6000 });
    await sendSOS({
      message: automatic
        ? "Automatic SOS: I didn't respond to a safety check."
        : "Emergency! I need help.",
    });
  };

  return (
    <div className="space-y-4">
      <SafeMap position={position} {...mapProps} />

      {lastResult && <SOSShareSheet result={lastResult} onClose={clearResult} />}

      {pendingAlert && (
        <SafetyCheckModal
          key={`${pendingAlert.type}-${pendingAlert.journeyId}`}
          alert={pendingAlert}
          onOk={handleOk}
          onSOS={handleSOS}
        />
      )}
    </div>
  );
}

export default MapCard;
