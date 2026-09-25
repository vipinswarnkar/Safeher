import { Link } from "react-router-dom";
import { HiOutlineMap, HiOutlineArrowRight } from "react-icons/hi2";

import useApi from "../hooks/useApi";
import MapCard from "../components/MapCard";
import StartJourneyCard from "../components/StartJourneyCard";
import PageLayout, { LoadingState, EmptyState } from "../components/PageLayout";
import {
  formatDateTime,
  formatDuration,
  shortPlace,
  STATUS_STYLES,
} from "../utils/format";

function Journey() {
  // 404 from /journey/active just means "no journey running"
  const active = useApi("/journey/active");
  const history = useApi("/journey/history");

  const activeJourney = active.data?.journey ?? null;
  const pastJourneys = (history.data?.journeys ?? [])
    .filter((j) => j.status !== "active")
    .slice(0, 3);

  const refresh = () => {
    active.reload();
    history.reload();
  };

  const isLoading = active.loading || history.loading;
  const activeFailed = active.error && active.error.response?.status !== 404;

  return (
    <PageLayout
      title="Journey"
      subtitle={
        activeJourney
          ? "You're being tracked. End the journey when you arrive."
          : "Start a journey so your trip is tracked from start to finish."
      }
    >
      <MapCard />

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          {activeFailed ? (
            <p className="text-sm text-red-600">
              Couldn't check your active journey. Please try again in a moment.
            </p>
          ) : (
            <>
              {activeJourney && (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-4 text-sm text-green-800">
                  On the way for{" "}
                  <span className="font-semibold">
                    {formatDuration(activeJourney.startedAt)}
                  </span>
                  . Your contacts can be alerted with one tap from the SOS tab.
                </div>
              )}

              <StartJourneyCard
                activeJourney={activeJourney}
                onJourneyStarted={refresh}
              />
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent journeys
              </h2>
              <Link
                to="/history"
                className="text-sm text-rose-600 font-semibold flex items-center gap-1 hover:underline"
              >
                See all <HiOutlineArrowRight size={14} />
              </Link>
            </div>

            {pastJourneys.length === 0 ? (
              <EmptyState
                icon={HiOutlineMap}
                title="No past journeys"
                text="Journeys you finish will show up here."
              />
            ) : (
              <ul className="space-y-3">
                {pastJourneys.map((journey) => (
                  <li key={journey._id} className="bg-white rounded-3xl shadow p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900 truncate">
                        {shortPlace(journey.destination)}
                      </p>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[journey.status]}`}
                      >
                        {journey.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatDateTime(journey.startedAt)}
                      {journey.endedAt &&
                        ` · ${formatDuration(journey.startedAt, journey.endedAt)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
}

export default Journey;
