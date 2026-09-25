import { Link } from "react-router-dom";
import {
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineFlag,
} from "react-icons/hi2";

const actions = [
  { title: "Contacts", icon: HiOutlineUserGroup, path: "/contacts" },
  { title: "Safety Map", icon: HiOutlineShieldCheck, path: "/safety" },
  { title: "Report Spot", icon: HiOutlineFlag, path: "/safety" },
  { title: "History", icon: HiOutlineClock, path: "/history" },
];

function QuickActions() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.path}
            className="bg-white rounded-3xl shadow-md p-5 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition"
          >
            <action.icon className="text-rose-600" size={32} />
            <p className="font-medium text-slate-800">{action.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
