import { useEffect, useState } from "react";
import api from "../services/api";

import DashboardHeader from "../components/DashboardHeader";
import DashboardStats from "../components/Dashboardstats";
import MapCard from "../components/MapCard";
import SafetyScoreCard from "../components/SafetyScoreCard";
import StartJourneyCard from "../components/StartJourneyCard";
import SOSCard from "../components/SOSCard";
import QuickActions from "../components/QuickActions";
import BottomNav from "../components/BottomNav";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(null);

  // Refresh after starting/ending a journey or sending an SOS
  const fetchDashboard = async () => {
    try {
      const response = await api.get("/dashboard");
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  };

  // Runs only once when page loads
  useEffect(() => {
    let cancelled = false;

    api
      .get("/dashboard")
      .then((response) => {
        if (!cancelled) setDashboard(response.data.dashboard);
      })
      .catch((error) => console.error("Dashboard Error:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Ignore the response if the user left the page before it arrived
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        Loading...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Failed to load dashboard.
      </div>
    );
  }

  const lastKnown = position || dashboard.latestLocation;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-md mx-auto px-5 py-6 pb-28 space-y-6">
        <DashboardHeader user={dashboard.user} />

        <SafetyScoreCard position={position} compact />

        <MapCard
          location={dashboard.latestLocation}
          onPositionChange={setPosition}
          plannedRoute={dashboard.activeJourney?.plannedRoute}
          destination={dashboard.activeJourney?.destinationLocation}
          fitToRoutes={false}
          height={260}
        />

        <StartJourneyCard activeJourney={dashboard.activeJourney} onJourneyChanged={fetchDashboard} />

        <SOSCard lastKnownLocation={lastKnown} onSOSSent={fetchDashboard} />

        <DashboardStats dashboard={dashboard} />

        <QuickActions />
      </div>

      <BottomNav />
    </div>
  );
}

export default Dashboard;
