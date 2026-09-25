import { useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineLink, HiOutlineShare, HiOutlineCheckCircle } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";

import api from "../services/api";
import { formatDuration, formatTime, shortPlace } from "../utils/format";
import { whatsappLink } from "../utils/location";
import { LEVEL_STYLES, levelOf } from "../utils/safety";

// Running journey: live link sharing, manual check-in and End button
function ActiveJourneyCard({ journey, onEnded }) {
  const [ending, setEnding] = useState(false);

  const eta = journey.expectedDurationSec
    ? new Date(new Date(journey.startedAt).getTime() + journey.expectedDurationSec * 1000)
    : null;

  const shareText = `I'm on my way to ${shortPlace(journey.destination)}. Follow my live location on SafeHer: ${journey.trackingUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(journey.trackingUrl);
      toast.success("Tracking link copied");
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy it.");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "My live location", text: shareText, url: journey.trackingUrl });
    } catch {
      // User cancelled the share sheet
    }
  };

  const checkIn = async () => {
    try {
      await api.post(`/journey/${journey._id}/check-in`, { alertType: "manual" });
      toast.success("Checked in. Anyone following your link can see it.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Check-in failed");
    }
  };

  const endJourney = async () => {
    try {
      setEnding(true);
      await api.patch(`/journey/end/${journey._id}`);
      toast.success("Journey ended. Glad you made it!");
      onEnded?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to end journey");
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-green-600 font-semibold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Journey active
          </p>
          <h2 className="text-lg font-bold text-slate-900 mt-1 truncate">{shortPlace(journey.destination)}</h2>
          <p className="text-sm text-slate-500">
            Started {formatTime(journey.startedAt)} · {formatDuration(journey.startedAt)} ago
            {eta && ` · ETA ${formatTime(eta)}`}
          </p>
        </div>
        {journey.routeSafetyScore != null && (
          <div className={`text-center px-3 py-1 rounded-xl ${LEVEL_STYLES[levelOf(journey.routeSafetyScore)].bg}`}>
            <p className={`text-lg font-bold ${LEVEL_STYLES[levelOf(journey.routeSafetyScore)].text}`}>
              {journey.routeSafetyScore}
            </p>
            <p className="text-[10px] text-slate-500">route</p>
          </div>
        )}
      </div>

      {journey.trackingUrl && (
        <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-700">Share your live location</p>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={whatsappLink(shareText)}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 bg-green-600 text-white py-2 rounded-xl text-xs font-semibold"
            >
              <FaWhatsapp size={18} /> WhatsApp
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="flex flex-col items-center gap-1 bg-white border border-slate-200 py-2 rounded-xl text-xs font-semibold text-slate-700"
            >
              <HiOutlineLink size={18} /> Copy link
            </button>
            <button
              type="button"
              onClick={nativeShare}
              disabled={!navigator.share}
              className="flex flex-col items-center gap-1 bg-white border border-slate-200 py-2 rounded-xl text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              <HiOutlineShare size={18} /> More
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={checkIn}
          className="flex items-center justify-center gap-2 border border-green-600 text-green-700 py-3 rounded-2xl font-semibold"
        >
          <HiOutlineCheckCircle size={20} /> I'm OK
        </button>
        <button
          type="button"
          onClick={endJourney}
          disabled={ending}
          className="bg-slate-900 text-white py-3 rounded-2xl font-semibold disabled:opacity-60"
        >
          {ending ? "Ending..." : "End journey"}
        </button>
      </div>
    </div>
  );
}

export default ActiveJourneyCard;
