import { Link } from "react-router-dom";
import { HiOutlineShieldExclamation } from "react-icons/hi2";

function DashboardHeader({ user }) {
  // Greeting based on current time
  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  }

  return (
    <div className="flex items-center justify-between">
      {/* Left Section */}
      <div>
        <p className="text-sm text-slate-500">
          {greeting}
        </p>

        <h1 className="text-2xl font-bold text-slate-900">
          {user?.name || "User"}
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Stay safe wherever you travel.
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Quick link to the SOS page */}
        <Link
          to="/sos"
          className="w-11 h-11 rounded-full bg-red-50 text-red-600 shadow-md flex items-center justify-center hover:bg-red-100 transition"
          aria-label="Emergency SOS"
        >
          <HiOutlineShieldExclamation className="text-2xl" />
        </Link>

        {/* User Avatar */}
        <Link
          to="/profile"
          className="w-11 h-11 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-md"
          aria-label="Profile"
        >
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </Link>
      </div>
    </div>
  );
}

export default DashboardHeader;