import { HiOutlineMapPin } from "react-icons/hi2";

function StartJourneyCard() {
  return (

    <div className="bg-white rounded-3xl shadow-lg p-5 space-y-4">

      <div>

        <p className="text-xs text-slate-500">
          Current Location
        </p>

        <h3 className="font-semibold text-slate-900">
          Detect Automatically
        </h3>

      </div>

      <div>

        <label className="text-xs text-slate-500">
          Destination
        </label>

        <div className="relative mt-2">

          <HiOutlineMapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600"
            size={20}
          />

          <input
            type="text"
            placeholder="Where are you going?"
            className="
            w-full
            rounded-2xl
            border
            border-slate-200
            py-3
            pl-11
            pr-4
            outline-none
            focus:ring-2
            focus:ring-rose-500
            "
          />

        </div>

      </div>

      <button
        className="
        w-full
        bg-rose-600
        text-white
        rounded-2xl
        py-3
        font-semibold
        hover:bg-rose-700
        transition
        "
      >
        Start Journey
      </button>

    </div>

  );
}

export default StartJourneyCard;