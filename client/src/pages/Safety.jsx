import { useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineFlag, HiOutlineXMark, HiOutlineTrash } from "react-icons/hi2";

import api from "../services/api";
import useApi from "../hooks/useApi";
import MapCard from "../components/MapCard";
import SafetyScoreCard from "../components/SafetyScoreCard";
import NearbySafePlaces from "../components/NearbySafePlaces";
import PageLayout from "../components/PageLayout";
import { REPORT_TYPES, SEVERITY, PLACE_STYLES, reportLabel } from "../utils/safety";
import { formatDateTime } from "../utils/format";

function ReportForm({ point, usingCurrentLocation, onClose, onSaved }) {
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState(2);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!type) {
      toast.error("Choose what happened");
      return;
    }
    if (!point) {
      toast.error("Tap the map to choose where it happened");
      return;
    }
    try {
      setSaving(true);
      const { data } = await api.post("/reports", {
        type,
        severity,
        description: description.trim() || undefined,
        latitude: point.latitude,
        longitude: point.longitude,
      });
      toast.success(data.message);
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl shadow-lg p-5 space-y-4 border-2 border-rose-200">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Report an unsafe spot</h2>
          <p className="text-xs text-slate-500 mt-1">
            {usingCurrentLocation
              ? "Using your current location. Tap the map to pick a different spot."
              : "Location picked on the map."}{" "}
            Reports are anonymous.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400" aria-label="Close">
          <HiOutlineXMark size={22} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {REPORT_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`text-left text-sm px-3 py-2 rounded-xl border ${
              type === t.value ? "border-rose-500 bg-rose-50 text-rose-700 font-semibold" : "border-slate-200 text-slate-700"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2">How serious?</p>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITY.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              className="py-2 rounded-xl text-sm font-semibold border"
              style={
                severity === s.value
                  ? { backgroundColor: s.color, borderColor: s.color, color: "white" }
                  : { borderColor: "#e2e8f0", color: "#475569" }
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Anything others should know? (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        rows={2}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 text-sm"
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white py-3 rounded-2xl font-semibold"
      >
        {saving ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
}

function MyReports({ reload: reloadMap }) {
  const { data, reload } = useApi("/reports/mine");
  const reports = data?.reports ?? [];
  if (reports.length === 0) return null;

  const remove = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success("Report deleted");
      reload();
      reloadMap();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Your reports</h2>
      <ul className="space-y-2">
        {reports.slice(0, 10).map((r) => (
          <li key={r.id} className="bg-white rounded-2xl shadow p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900">{reportLabel(r.type)}</p>
              <p className="text-xs text-slate-500">
                {SEVERITY[r.severity - 1]?.label} · {formatDateTime(r.createdAt)}
              </p>
            </div>
            <button type="button" onClick={() => remove(r.id)} className="p-2 text-red-500" aria-label="Delete report">
              <HiOutlineTrash size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Safety() {
  const [position, setPosition] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [pickedPoint, setPickedPoint] = useState(null);

  // Rounded to ~100 m so we only refetch after real movement
  const area = position ? `lat=${position.latitude.toFixed(3)}&lng=${position.longitude.toFixed(3)}` : null;
  const places = useApi(area ? `/safety/places?${area}&radius=1500` : null);
  const reports = useApi(area ? `/reports/nearby?${area}&radius=2000` : null);

  const reportPoint = pickedPoint || position;

  return (
    <PageLayout
      title="Safety Map"
      subtitle="Safe places near you and spots others have reported."
      action={
        !reporting && (
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="shrink-0 flex items-center gap-1 bg-rose-600 text-white px-4 h-11 rounded-full shadow-md text-sm font-semibold"
          >
            <HiOutlineFlag size={18} /> Report
          </button>
        )
      }
    >
      <MapCard
        onPositionChange={setPosition}
        places={places.data?.places}
        reports={reports.data?.reports}
        pickedPoint={reporting ? pickedPoint : null}
        onMapClick={reporting ? setPickedPoint : undefined}
        follow={!reporting}
        height={340}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
        {Object.entries(PLACE_STYLES).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /> {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/60 border border-red-500" /> Reported spot
        </span>
      </div>

      {reporting && (
        <ReportForm
          point={reportPoint}
          usingCurrentLocation={!pickedPoint}
          onClose={() => {
            setReporting(false);
            setPickedPoint(null);
          }}
          onSaved={() => {
            setReporting(false);
            setPickedPoint(null);
            reports.reload();
          }}
        />
      )}

      <SafetyScoreCard position={position} showLink={false} />

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Nearest safe places</h2>
        {!position ? (
          <p className="text-sm text-slate-500">Waiting for your location...</p>
        ) : (
          <NearbySafePlaces
            loading={places.loading}
            places={places.data?.places}
            available={places.data?.available !== false && !places.error}
            limit={8}
          />
        )}
      </div>

      <MyReports reload={reports.reload} />
    </PageLayout>
  );
}

export default Safety;
