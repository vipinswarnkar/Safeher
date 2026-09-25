import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  Circle,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { LEVEL_STYLES, levelOf, PLACE_STYLES, reportLabel, SEVERITY } from "../utils/safety";
import { formatDistance } from "../utils/location";

// Leaflet's default marker images don't survive bundling; point them at the CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// [lng, lat] (GeoJSON) -> [lat, lng] (Leaflet)
const toLatLngs = (coords = []) => coords.map(([lng, lat]) => [lat, lng]);

// Pulsing blue dot for "you are here"
const youAreHereIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 6px rgba(37,99,235,.25)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destinationIcon = L.divIcon({
  className: "",
  html: '<div style="font-size:28px;line-height:28px;transform:translate(-2px,-24px)">📍</div>',
  iconSize: [28, 28],
});

// Follow the user, or fit everything in view when there are routes
function ViewController({ center, bounds, follow }) {
  const map = useMap();
  const boundsKey = bounds ? JSON.stringify(bounds) : null;

  useEffect(() => {
    if (boundsKey) {
      map.fitBounds(JSON.parse(boundsKey), { padding: [30, 30] });
    }
  }, [boundsKey, map]);

  useEffect(() => {
    if (!boundsKey && follow && center) map.setView(center, map.getZoom() < 14 ? 16 : map.getZoom());
  }, [center, follow, boundsKey, map]);

  return null;
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
  });
  return null;
}

/*
 * Presentational map. Everything is optional:
 *   position      { latitude, longitude }        blue "you" dot
 *   routes        [{ coordinates, safetyScore }] route options (selected one drawn on top)
 *   plannedRoute  [[lng, lat]]                   dashed planned route
 *   path          [[lng, lat]]                   travelled path
 *   destination   { latitude, longitude }
 *   places        safe places from the API
 *   reports       community reports
 *   pickedPoint   point chosen by tapping the map
 */
function SafeMap({
  position,
  routes,
  selectedRouteIndex = 0,
  onSelectRoute,
  plannedRoute,
  path,
  destination,
  places,
  reports,
  pickedPoint,
  onMapClick,
  height = 320,
  follow = true,
  fitToRoutes = true,
}) {
  const center = useMemo(
    () => (position ? [position.latitude, position.longitude] : null),
    [position]
  );

  // When routes are shown, fit them all in the view
  const bounds = useMemo(() => {
    if (!fitToRoutes) return null;
    const pts = [
      ...(routes || []).flatMap((r) => toLatLngs(r.coordinates)),
      ...toLatLngs(plannedRoute || []),
    ];
    if (pts.length < 2) return null;
    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [routes, plannedRoute, fitToRoutes]);

  // Mumbai until we know where the user is
  const initialCenter = center || [19.076, 72.8777];

  // Draw unselected routes first so the selected one is on top
  const orderedRoutes = (routes || [])
    .map((route, index) => ({ route, index }))
    .sort((a, b) => (a.index === selectedRouteIndex ? 1 : 0) - (b.index === selectedRouteIndex ? 1 : 0));

  return (
    <div className="rounded-3xl overflow-hidden shadow-lg relative z-0">
      <MapContainer center={initialCenter} zoom={15} style={{ height, width: "100%" }}>
        <ViewController center={center} bounds={bounds} follow={follow} />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Community reports: soft circles coloured by severity */}
        {reports?.map((r) => (
          <Circle
            key={r.id}
            center={[r.latitude, r.longitude]}
            radius={60}
            pathOptions={{
              color: SEVERITY[r.severity - 1]?.color,
              fillColor: SEVERITY[r.severity - 1]?.color,
              fillOpacity: 0.25,
              weight: 1,
            }}
          >
            <Popup>
              <strong>{reportLabel(r.type)}</strong>
              <br />
              {SEVERITY[r.severity - 1]?.label} · {new Date(r.createdAt).toLocaleDateString()}
              {r.description && (
                <>
                  <br />
                  {r.description}
                </>
              )}
            </Popup>
          </Circle>
        ))}

        {/* Route options */}
        {orderedRoutes.map(({ route, index }) => {
          const selected = index === selectedRouteIndex;
          const color = LEVEL_STYLES[levelOf(route.safetyScore)].route;
          return (
            <Polyline
              key={index}
              positions={toLatLngs(route.coordinates)}
              pathOptions={{
                color: selected ? color : "#94a3b8",
                weight: selected ? 7 : 5,
                opacity: selected ? 0.9 : 0.6,
              }}
              eventHandlers={{ click: () => onSelectRoute?.(index) }}
            >
              <Tooltip sticky>
                Route {index + 1} · safety {route.safetyScore}
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Risky spots on the selected route */}
        {routes?.[selectedRouteIndex]?.riskyPoints?.map((p, i) => (
          <CircleMarker
            key={`risk-${i}`}
            center={[p.latitude, p.longitude]}
            radius={6}
            pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.8 }}
          >
            <Tooltip>Low safety score here ({p.score})</Tooltip>
          </CircleMarker>
        ))}

        {plannedRoute && (
          <Polyline
            positions={toLatLngs(plannedRoute)}
            pathOptions={{ color: "#e11d48", weight: 4, opacity: 0.5, dashArray: "8 8" }}
          />
        )}

        {path && path.length > 1 && (
          <Polyline positions={toLatLngs(path)} pathOptions={{ color: "#2563eb", weight: 5 }} />
        )}

        {/* Safe places */}
        {places?.map((p) => {
          const style = PLACE_STYLES[p.category] || PLACE_STYLES.fuel;
          return (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={8}
              pathOptions={{ color: "white", weight: 2, fillColor: style.color, fillOpacity: 1 }}
            >
              <Popup>
                <strong>
                  {style.emoji} {p.name}
                </strong>
                <br />
                {style.label}
                {p.distanceMeters != null && ` · ${formatDistance(p.distanceMeters)}`}
                {p.phone && (
                  <>
                    <br />
                    <a href={`tel:${p.phone}`}>Call {p.phone}</a>
                  </>
                )}
              </Popup>
            </CircleMarker>
          );
        })}

        {destination && (
          <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {pickedPoint && (
          <Marker position={[pickedPoint.latitude, pickedPoint.longitude]}>
            <Popup>Report location</Popup>
          </Marker>
        )}

        {center && (
          <Marker position={center} icon={youAreHereIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default SafeMap;
