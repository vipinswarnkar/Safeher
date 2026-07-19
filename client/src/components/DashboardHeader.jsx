import { HiOutlineBell } from "react-icons/hi2";

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
        {/* Notification */}
        <button className="relative w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 transition">
          <HiOutlineBell className="text-2xl text-slate-700" />

          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Avatar */}
        <div className="w-11 h-11 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;