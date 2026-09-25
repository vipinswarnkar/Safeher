import { HiOutlineShieldExclamation } from "react-icons/hi2";
import useSOS from "../hooks/useSOS";
import SOSShareSheet from "./SOSShareSheet";

function SOSCard({ lastKnownLocation, onSOSSent }) {
  const { sendSOS, sending, lastResult, clearResult } = useSOS({
    lastKnownLocation,
    onSent: onSOSSent,
  });

  const handleSOS = () => {
    if (!window.confirm("Send an emergency alert to all your trusted contacts?")) return;
    sendSOS();
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl shadow-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <HiOutlineShieldExclamation size={28} />
          </div>

          <div>
            <h2 className="text-xl font-bold">Emergency SOS</h2>
            <p className="text-sm text-red-100 mt-1">
              Instantly notify your trusted contacts with your live location.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSOS}
          disabled={sending}
          className="mt-6 w-full bg-white text-red-600 py-3 rounded-2xl font-bold hover:scale-[1.02] disabled:opacity-70 transition"
        >
          {sending ? "Sending Alert..." : "Send Emergency Alert"}
        </button>
      </div>

      {lastResult && <SOSShareSheet result={lastResult} onClose={clearResult} />}
    </div>
  );
}

export default SOSCard;
