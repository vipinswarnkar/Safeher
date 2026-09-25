import { Link } from "react-router-dom";
import { HiOutlineShieldCheck, HiOutlineArrowRight } from "react-icons/hi2";
import useApi from "../hooks/useApi";
import { LEVEL_STYLES } from "../utils/safety";

// Circular score gauge
function ScoreRing({ score, color }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0" aria-hidden="true">
      <circle cx="38" cy="38" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill="#0f172a">
        {score}
      </text>
    </svg>
  );
}

/*
 * Safety score for where the user is right now.
 * Coordinates are rounded to ~100 m so the score is only re-fetched after real movement.
 */
function SafetyScoreCard({ position, showLink = true, compact = false }) {
  const url = position
    ? `/safety/score?lat=${position.latitude.toFixed(3)}&lng=${position.longitude.toFixed(3)}`
    : null;
  const { data, loading, error } = useApi(url);
  const safety = data?.safety;

  if (!position) {
    return (
      <div className="bg-white rounded-3xl shadow p-5 text-sm text-slate-500 flex items-center gap-3">
        <HiOutlineShieldCheck size={24} className="text-rose-500" />
        Allow location access to see how safe your area is.
      </div>
    );
  }

  if (loading || (!safety && !error)) {
    return <div className="bg-white rounded-3xl shadow p-5 h-28 animate-pulse" />;
  }

  if (error || !safety) {
    return (
      <div className="bg-white rounded-3xl shadow p-5 text-sm text-slate-500">
        Couldn't load the safety score right now.
      </div>
    );
  }

  const style = LEVEL_STYLES[safety.level];

  return (
    <div className="bg-white rounded-3xl shadow p-5">
      <div className="flex items-center gap-4">
        <ScoreRing score={safety.score} color={style.ring} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">Area safety right now</p>
          <p className={`inline-block mt-1 text-sm font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {safety.label}
          </p>
          {!compact && safety.factors?.[0] && (
            <p className="text-xs text-slate-600 mt-2">{safety.factors[0].text}</p>
          )}
        </div>
        {showLink && (
          <Link to="/safety" className="text-rose-600 p-2" aria-label="Open safety map">
            <HiOutlineArrowRight size={20} />
          </Link>
        )}
      </div>

      {!compact && (
        <ul className="mt-4 space-y-1">
          {safety.factors.slice(1).map((f) => (
            <li key={f.text} className="text-xs text-slate-600 flex gap-2">
              <span className={f.impact === "positive" ? "text-green-600" : "text-red-500"}>
                {f.impact === "positive" ? "▲" : "▼"}
              </span>
              {f.text}
            </li>
          ))}
        </ul>
      )}

      {safety.nearbyIncidents === 0 && !compact && (
        <p className="text-[11px] text-slate-400 mt-3">
          Based on community reports, SOS history, nearby safe places and time of day. Few reports here
          yet, so the score leans on nearby places and time.
        </p>
      )}
    </div>
  );
}

export default SafetyScoreCard;
