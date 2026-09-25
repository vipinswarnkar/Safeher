import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { getCurrentPosition } from "../utils/location";

/*
 * Sends an SOS. Used by the SOS button and by the "Are you OK?" auto-SOS.
 * Returns the server response (or null on failure). The response includes
 * `shareMessage` and `contactPhones` so the app can also open WhatsApp/SMS
 * on the user's own phone as a free backup channel.
 */
export default function useSOS({ lastKnownLocation, onSent } = {}) {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const sendSOS = useCallback(
    async ({ message } = {}) => {
      try {
        setSending(true);

        let latitude;
        let longitude;
        try {
          ({ latitude, longitude } = await getCurrentPosition({ timeout: 8000 }));
        } catch {
          // Fall back to the last saved location so the alert still goes out
          if (!lastKnownLocation) {
            toast.error("Couldn't get your location. Please turn on location access.");
            return null;
          }
          ({ latitude, longitude } = lastKnownLocation);
          toast("Using your last known location", { icon: "📍" });
        }

        const { data } = await api.post("/sos/trigger", { latitude, longitude, message });
        const { emergencyContacts, contactsReached, delivery } = data;

        if (delivery === "console") {
          toast.success("SOS saved. Now send it from your phone below.", { duration: 6000 });
        } else if (contactsReached === emergencyContacts) {
          toast.success(`Alert sent to all ${emergencyContacts} contact(s)`);
        } else if (contactsReached > 0) {
          toast(`Alert reached ${contactsReached} of ${emergencyContacts} contacts. Send it from your phone too.`, {
            icon: "⚠️",
            duration: 6000,
          });
        } else {
          toast.error("Automatic message failed. Send it from your phone below, or call 112.", { duration: 8000 });
        }

        setLastResult(data);
        onSent?.(data);
        return data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send SOS. Call 112 now.");
        return null;
      } finally {
        setSending(false);
      }
    },
    [lastKnownLocation, onSent]
  );

  return { sendSOS, sending, lastResult, clearResult: () => setLastResult(null) };
}
