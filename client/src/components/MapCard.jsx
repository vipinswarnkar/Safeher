import { useEffect, useState } from "react";
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

function MapCard() {
  const [position, setPosition] = useState([19.0760, 72.8777]);

  useEffect(() => {

  const watchId = navigator.geolocation.watchPosition(

    async (location) => {

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      setPosition([latitude, longitude]);

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);

      try {

          const token = localStorage.getItem("token");

          await api.post(
              "/location/update",
              {
                  latitude,
                  longitude,
                  accuracy: location.coords.accuracy,
                  speed: location.coords.speed,
              },
              {
                  headers: {
                      Authorization: `Bearer ${token}`,
                  },
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