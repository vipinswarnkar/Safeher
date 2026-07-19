import { HiOutlineShieldExclamation } from "react-icons/hi2";

function SOSCard() {
  return (
    <div
      className="
      bg-gradient-to-r
      from-red-600
      to-rose-600
      rounded-3xl
      shadow-xl
      p-6
      text-white
      "
    >
      <div className="flex items-center gap-3">

        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">

          <HiOutlineShieldExclamation size={28} />

        </div>

        <div>

          <h2 className="text-xl font-bold">
            Emergency SOS
          </h2>

          <p className="text-sm text-red-100 mt-1">
            Instantly notify your trusted contacts and nearby SafeHer users.
          </p>

        </div>

      </div>

      <button
        className="
        mt-6
        w-full
        bg-white
        text-red-600
        py-3
        rounded-2xl
        font-bold
        hover:scale-[1.02]
        transition
        "
      >
        Send Emergency Alert
      </button>

    </div>
  );
}

export default SOSCard;