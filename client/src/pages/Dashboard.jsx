import { useEffect, useState } from "react";
import api from "../services/api";

import DashboardHeader from "../components/DashboardHeader";
import DashboardStats from "../components/Dashboardstats";
import SearchBar from "../components/SearchBar";
import MapCard from "../components/MapCard";
import StartJourneyCard from "../components/StartJourneyCard";
import SOSCard from "../components/SOSCard";
import QuickActions from "../components/QuickActions";
import BottomNav from "../components/BottomNav";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from backend
  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDashboard(response.data.dashboard);

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Runs only once when page loads
  useEffect(() => {
    fetchDashboard();
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

  return (
    <div className="min-h-screen bg-slate-100">

      <div className="max-w-md mx-auto px-5 py-6 pb-28 space-y-6">

        <DashboardHeader user={dashboard.user} />

        <DashboardStats dashboard={dashboard} />

        <SearchBar />

        <MapCard location={dashboard.latestLocation} />

        <StartJourneyCard
          activeJourney={dashboard.activeJourney}
          onJourneyStarted={fetchDashboard}
        />

        <SOSCard />

        <QuickActions />

      </div>

      <BottomNav />

    </div>
  );
}

export default Dashboard;