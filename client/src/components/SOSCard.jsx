import { useState } from "react";
import { HiOutlineShieldExclamation } from "react-icons/hi2";
import toast from "react-hot-toast";
import api from "../services/api";

// Get the current position once, as a promise
const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported on this device"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });

function SOSCard({ lastKnownLocation, onSOSSent }) {
  const [sending, setSending] = useState(false);

  const handleSOS = async () => {
    if (!window.confirm("Send an emergency alert to all your trusted contacts?")) {
      return;
    }

    try {
      setSending(true);

      let latitude;
      let longitude;

      try {
        const position = await getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // Fall back to the last location we saved, so the alert still goes out
        if (!lastKnownLocation) {
          toast.error("Couldn't get your location. Please turn on location access.");
          return;
        }
        latitude = lastKnownLocation.latitude;
        longitude = lastKnownLocation.longitude;
        toast("Using your last known location", { icon: "📍" });
      }

      const response = await api.post("/sos/trigger", { latitude, longitude });

      toast.success(
        `Alert sent to ${response.data.emergencyContacts} contact(s)`
      );

      if (onSOSSent) onSOSSent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send SOS");
    } finally {
      setSending(false);
    }
  };

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
            Instantly notify your trusted contacts with your live location.
          </p>

        </div>

      </div>

      <button
        type="button"
        onClick={handleSOS}
        disabled={sending}
        className="
        mt-6
        w-full
        bg-white
        text-red-600
        py-3
        rounded-2xl
        font-bold
        hover:scale-[1.02]
        disabled:opacity-70
        transition
        "
      >
        {sending ? "Sending Alert..." : "Send Emergency Alert"}
      </button>

    </div>
  );
}

export default SOSCard;
