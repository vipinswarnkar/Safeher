import { Link } from "react-router-dom";
import {
  HiOutlinePhone,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
} from "react-icons/hi2";

import useApi from "../hooks/useApi";
import SOSCard from "../components/SOSCard";
import PageLayout, { LoadingState } from "../components/PageLayout";
import { formatDateTime } from "../utils/format";

// National emergency numbers in India
const HELPLINES = [
  { name: "Emergency (all services)", number: "112" },
  { name: "Women Helpline", number: "1091" },
  { name: "Police", number: "100" },
  { name: "Ambulance", number: "108" },
];

function SOS() {
  const contacts = useApi("/contacts");
  const sosHistory = useApi("/sos/history");
  const latest = useApi("/location/latest");

  const contactList = contacts.data?.contacts ?? [];
  const activeAlerts = (sosHistory.data?.sosHistory ?? []).filter(
    (s) => s.status === "active"
  );

  return (
    <PageLayout
      title="Emergency"
      subtitle="Help is one tap away."
    >
      {activeAlerts.length > 0 && (
        <Link
          to="/history"
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-3xl p-4 text-red-700"
        >
          <HiOutlineExclamationTriangle size={24} className="shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">
              {activeAlerts.length} active alert{activeAlerts.length > 1 ? "s" : ""}
            </p>
            <p>Last sent {formatDateTime(activeAlerts[0].createdAt)}. Mark yourself safe in History.</p>
          </div>
          <HiOutlineArrowRight size={18} />
        </Link>
      )}

      {!contacts.loading && contactList.length === 0 && (
        <Link
          to="/contacts"
          className="block bg-amber-50 border border-amber-200 rounded-3xl p-4 text-sm text-amber-800"
        >
          <span className="font-semibold">Add a trusted contact first.</span> SOS
          alerts can't be sent until you have at least one.
        </Link>
      )}

      <SOSCard
        lastKnownLocation={latest.data?.location}
        onSOSSent={sosHistory.reload}
      />

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Emergency helplines
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {HELPLINES.map((line) => (
            <a
              key={line.number}
              href={`tel:${line.number}`}
              className="bg-white rounded-3xl shadow p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl font-bold text-rose-600">{line.number}</p>
              <p className="text-xs text-slate-500 mt-1">{line.name}</p>
            </a>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Who gets alerted
          </h2>
          <Link
            to="/contacts"
            className="text-sm text-rose-600 font-semibold hover:underline"
          >
            Manage
          </Link>
        </div>

        {contacts.loading ? (
          <LoadingState />
        ) : (
          <ul className="space-y-2">
            {contactList.map((contact) => (
              <li
                key={contact._id}
                className="bg-white rounded-2xl shadow p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                  <p className="text-xs text-slate-500">{contact.relationship}</p>
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  aria-label={`Call ${contact.name}`}
                >
                  <HiOutlinePhone size={20} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}

export default SOS;
