import { Link } from "react-router-dom";
import { HiOutlineMapPin, HiOutlineArrowRight } from "react-icons/hi2";
import ActiveJourneyCard from "./ActiveJourneyCard";

// Dashboard card: the running journey, or a prompt to plan a safe one
function StartJourneyCard({ activeJourney, onJourneyChanged }) {
  if (activeJourney) {
    return <ActiveJourneyCard journey={activeJourney} onEnded={onJourneyChanged} />;
  }

  return (
    <Link
      to="/journey"
      className="bg-white rounded-3xl shadow-lg p-5 flex items-center gap-4 hover:shadow-xl transition"
    >
      <div className="w-12 h-12 shrink-0 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
        <HiOutlineMapPin size={24} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">Going somewhere?</p>
        <p className="text-sm text-slate-500">Find the safest route and share a live tracking link.</p>
      </div>
      <HiOutlineArrowRight className="text-rose-600" size={20} />
    </Link>
  );
}

export default StartJourneyCard;
