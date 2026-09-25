import { HiOutlineChatBubbleLeftRight, HiOutlineXMark } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";
import { smsLink, whatsappLink } from "../utils/location";

/*
 * Free backup channel: opens WhatsApp / the SMS app on the user's own phone
 * with the SOS message already written. Works even without Twilio.
 */
function SOSShareSheet({ result, onClose }) {
  if (!result?.shareMessage) return null;

  const contacts = result.contacts || [];
  const phones = contacts.map((c) => c.phone);

  return (
    <div className="bg-white rounded-3xl shadow-lg p-5 space-y-3 border-2 border-red-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Send it from your phone too</h3>
          <p className="text-xs text-slate-500 mt-1">
            Opens your own WhatsApp or SMS app with the message ready. Just press send.
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-slate-400" aria-label="Close">
            <HiOutlineXMark size={20} />
          </button>
        )}
      </div>

      {phones.length > 0 && (
        <a
          href={smsLink(phones, result.shareMessage)}
          className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3 rounded-2xl font-semibold"
        >
          <HiOutlineChatBubbleLeftRight size={20} /> SMS all {phones.length} contact{phones.length > 1 ? "s" : ""}
        </a>
      )}

      <div className="grid grid-cols-2 gap-2">
        {contacts.slice(0, 6).map((contact) => (
          <a
            key={contact.phone}
            href={whatsappLink(result.shareMessage, contact.phone)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-2 rounded-2xl text-sm font-semibold truncate"
          >
            <FaWhatsapp size={18} className="shrink-0" /> <span className="truncate">{contact.name}</span>
          </a>
        ))}
        {phones.length === 0 && (
          <a
            href={whatsappLink(result.shareMessage)}
            target="_blank"
            rel="noreferrer"
            className="col-span-2 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-2xl text-sm font-semibold"
          >
            <FaWhatsapp size={18} /> Share on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default SOSShareSheet;
