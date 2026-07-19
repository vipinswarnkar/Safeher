import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineMap,
  HiOutlineShieldExclamation,
  HiOutlineClock,
  HiOutlineUser,
} from "react-icons/hi2";

function BottomNav() {
  const navItems = [
    {
      name: "Home",
      path: "/dashboard",
      icon: HiOutlineHome,
    },
    {
      name: "Journey",
      path: "/journey",
      icon: HiOutlineMap,
    },
    {
      name: "SOS",
      path: "/sos",
      icon: HiOutlineShieldExclamation,
    },
    {
      name: "History",
      path: "/history",
      icon: HiOutlineClock,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: HiOutlineUser,
    },
  ];

  return (
    <div
      className="
      fixed
      bottom-0
      left-0
      right-0
      bg-white
      border-t
      border-slate-200
      shadow-lg
      "
    >
      <div className="max-w-md mx-auto flex justify-around py-3">

        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs ${
                isActive
                  ? "text-rose-600"
                  : "text-slate-500"
              }`
            }
          >
            <item.icon size={24} />
            <span className="mt-1">{item.name}</span>
          </NavLink>
        ))}

      </div>
    </div>
  );
}

export default BottomNav;