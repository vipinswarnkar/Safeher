import { useState } from "react";
import toast from "react-hot-toast";
import {
  HiOutlineMap,
  HiOutlineShieldExclamation,
  HiOutlineMapPin,
} from "react-icons/hi2";

import api from "../services/api";
import useApi from "../hooks/useApi";
import PageLayout, {
  LoadingState,
  EmptyState,
  ErrorState,
} from "../components/PageLayout";
import {
  formatDateTime,
  formatDuration,
  shortPlace,
  STATUS_STYLES,
} from "../utils/format";

const TABS = [
  { id: "journeys", label: "Journeys" },
  { id: "sos", label: "SOS Alerts" },
];

function JourneyList() {
  const { data, loading, error, reload } = useApi("/journey/history");
  const journeys = data?.journeys ?? [];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={reload} />;
  if (journeys.length === 0) {
    return (
      <EmptyState
        icon={HiOutlineMap}
        title="No journeys yet"
        text="Start a journey from the Journey tab."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {journeys.map((journey) => (
        <li key={journey._id} className="bg-white rounded-3xl shadow p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                {journey.source === "Current Location"
                  ? "From current location"
                  : `From ${shortPlace(journey.source)}`}
              </p>
              <p className="font-semibold text-slate-900 truncate">
                {shortPlace(journey.destination)}
              </p>
            </div>
            <span
              className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[journey.status]}`}
            >
              {journey.status}
            </span>
          </div>

          {journey.routeSafetyScore != null && (
            <p className="text-xs text-slate-500 mt-1">Route safety score: {journey.routeSafetyScore}/100</p>
          )}

          <p className="text-sm text-slate-500 mt-2">
            {formatDateTime(journey.startedAt)}
            {journey.endedAt
              ? ` · took ${formatDuration(journey.startedAt, journey.endedAt)}`
              : journey.status === "active"
                ? ` · ${formatDuration(journey.startedAt)} so far`
                : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

function SOSList() {
  const { data, loading, error, reload } = useApi("/sos/history");
  const alerts = data?.sosHistory ?? [];
  const [resolvingId, setResolvingId] = useState(null);

  const handleResolve = async (id) => {
    try {
      setResolvingId(id);
      await api.patch(`/sos/resolve/${id}`);
      toast.success("Marked as safe. Your contacts have been told.");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update alert");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={reload} />;
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={HiOutlineShieldExclamation}
        title="No SOS alerts"
        text="We hope it stays that way."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((sos) => (
        <li
          key={sos._id}
          className={`bg-white rounded-3xl shadow p-4 ${
            sos.status === "active" ? "ring-2 ring-red-400" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{sos.message}</p>
              <p className="text-sm text-slate-500 mt-1">
                {formatDateTime(sos.createdAt)}
                {sos.journey && ` · to ${shortPlace(sos.journey.destination)}`}
              </p>
            </div>
            <span
              className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                sos.status === "active"
                  ? "bg-red-100 text-red-700"
                  : STATUS_STYLES.resolved
              }`}
            >
              {sos.status}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <a
              href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-rose-600 font-semibold flex items-center gap-1 hover:underline"
            >
              <HiOutlineMapPin size={16} /> View location
            </a>

            {sos.status === "active" && (
              <button
                type="button"
                onClick={() => handleResolve(sos._id)}
                disabled={resolvingId === sos._id}
                className="ml-auto text-sm bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-full font-semibold"
              >
                {resolvingId === sos._id ? "Updating..." : "I'm safe now"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function History() {
  const [tab, setTab] = useState("journeys");

  return (
    <PageLayout title="History" subtitle="Your past journeys and alerts.">
      <div className="bg-white rounded-2xl shadow p-1 grid grid-cols-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`py-2 rounded-xl text-sm font-semibold transition ${
              tab === t.id ? "bg-rose-600 text-white" : "text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "journeys" ? <JourneyList /> : <SOSList />}
    </PageLayout>
  );
}

export default History;
