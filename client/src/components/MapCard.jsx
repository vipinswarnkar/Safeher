import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import api from "../services/api";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ChangeMapView({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);

  return null;
}

// When to send a location update to the server:
// - the user moved at least MIN_DISTANCE_METERS (but not more than once per MIN_GAP_MS), or
// - HEARTBEAT_MS passed, so a stationary user still shows as "live".
// Stops the database filling up with duplicate points.
const MIN_GAP_MS = 5000;
const HEARTBEAT_MS = 60000;
const MIN_DISTANCE_METERS = 30;

// Distance between two lat/lng points in meters (haversine formula)
function distanceInMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function MapCard({ location }) {
  // Start from the last saved location if we have one, else Mumbai
  const [position, setPosition] = useState(
    location ? [location.latitude, location.longitude] : [19.076, 72.8777]
  );

  const lastSent = useRef({ time: 0, position: null });

  useEffect(() => {

  const watchId = navigator.geolocation.watchPosition(

    async (location) => {

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      setPosition([latitude, longitude]);

      const now = Date.now();
      const previous = lastSent.current;
      const elapsed = now - previous.time;
      const moved =
        !previous.position ||
        distanceInMeters(previous.position, [latitude, longitude]) >=
          MIN_DISTANCE_METERS;

      const shouldSend =
        (moved && elapsed >= MIN_GAP_MS) || elapsed >= HEARTBEAT_MS;

      if (!shouldSend) {
        return;
      }

      lastSent.current = { time: now, position: [latitude, longitude] };

      try {

          await api.post(
              "/location/update",
              {
                  latitude,
                  longitude,
                  accuracy: location.coords.accuracy,
                  speed: location.coords.speed,
              }
          );

      } catch (error) {

          console.log(error);

      }
    },

    (error) => {

      console.log(error);

    },

    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }

  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };

}, []);

  return (

    <div className="rounded-3xl overflow-hidden shadow-lg">

      <MapContainer
        center={position}
        zoom={16}
        style={{
          height: "350px",
          width: "100%",
        }}
      >

        <ChangeMapView center={position} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position}>
          <Popup>

            You are here

          </Popup>
        </Marker>

      </MapContainer>

    </div>

  );
}

export default MapCard;