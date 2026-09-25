import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineMap,
  HiOutlineShieldExclamation,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineUser,
} from "react-icons/hi2";

const navItems = [
  { name: "Home", path: "/dashboard", icon: HiOutlineHome },
  { name: "Journey", path: "/journey", icon: HiOutlineMap },
  { name: "Safety", path: "/safety", icon: HiOutlineShieldCheck },
  { name: "SOS", path: "/sos", icon: HiOutlineShieldExclamation, danger: true },
  { name: "History", path: "/history", icon: HiOutlineClock },
  { name: "Profile", path: "/profile", icon: HiOutlineUser },
];

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-[500]">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-[11px] px-1 py-1 ${
                isActive ? "text-rose-600 font-semibold" : item.danger ? "text-red-500" : "text-slate-500"
              }`
            }
          >
            <item.icon size={24} />
            <span className="mt-1">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
