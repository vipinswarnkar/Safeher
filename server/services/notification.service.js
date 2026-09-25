import twilio from "twilio";
import { trackingUrl } from "../utils/tracking.js";

/*
 * Sends SOS alerts to emergency contacts.
 *
 * Channels (set SOS_CHANNELS in .env, comma separated, e.g. "sms,whatsapp"):
 *   sms      -> Twilio SMS          (needs TWILIO_SMS_FROM)
 *   whatsapp -> Twilio WhatsApp     (needs TWILIO_WHATSAPP_FROM)
 *
 * If Twilio isn't configured, alerts are printed to the console so the app
 * still works in development.
 */

let client = null;

function getClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  if (!client) client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return client;
}

function enabledChannels() {
  const channels = (process.env.SOS_CHANNELS || "sms")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  // Only keep channels that have a sender number configured
  return channels.filter(
    (c) =>
      (c === "sms" && process.env.TWILIO_SMS_FROM) ||
      (c === "whatsapp" && process.env.TWILIO_WHATSAPP_FROM)
  );
}

// "98765 43210" / "09876543210" / "919876543210" -> "+919876543210"
export function toE164(phone) {
  if (!phone) return null;
  const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || "+91";
  const cleaned = String(phone).replace(/[\s\-()]/g, "");

  if (cleaned.startsWith("+")) return cleaned;

  const countryDigits = DEFAULT_COUNTRY_CODE.replace("+", "");
  if (cleaned.length === 10) return `${DEFAULT_COUNTRY_CODE}${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `${DEFAULT_COUNTRY_CODE}${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith(countryDigits) && cleaned.length === 10 + countryDigits.length) {
    return `+${cleaned}`;
  }
  return null; // can't tell what this number is
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

// Kept short so it fits in one or two SMS segments
function buildSOSMessage({ user, location, journey }) {
  const lines = [
    `SOS from SafeHer: ${user.name} needs help!`,
    `Location: ${location.mapUrl}`,
  ];
  if (journey?.destination) {
    lines.push(`Heading to: ${journey.destination.split(",")[0]}`);
  }
  if (journey?.shareToken && journey.status === "active") {
    lines.push(`Live tracking: ${trackingUrl(journey.shareToken)}`);
  }
  lines.push(`Time: ${formatTime()}`);
  if (user.phone) lines.push(`Call her: ${user.phone}`);
  return lines.join("\n");
}

function buildSafeMessage({ user }) {
  return `SafeHer update: ${user.name} has marked herself SAFE at ${formatTime()}. Thank you for being there.`;
}

// Send one message on one channel. Never throws: returns a result object.
async function sendOne({ channel, to, body, contactName }) {
  const result = { contactName, phone: to, channel, status: "failed" };

  const twilioClient = getClient();
  if (!twilioClient) {
    result.error = "Twilio not configured";
    return result;
  }

  try {
    const message = await twilioClient.messages.create(
      channel === "whatsapp"
        ? { from: process.env.TWILIO_WHATSAPP_FROM, to: `whatsapp:${to}`, body }
        : { from: process.env.TWILIO_SMS_FROM, to, body }
    );
    result.status = "sent";
    result.providerId = message.sid;
  } catch (error) {
    // Common trial error 21608: number not verified in the Twilio console
    result.error = error.code ? `${error.code}: ${error.message}` : error.message;
  }

  return result;
}

async function notifyContacts(contacts, body) {
  const channels = enabledChannels();

  // Development fallback: print instead of sending
  if (!getClient() || channels.length === 0) {
    console.log("=================================");
    console.log("[notifications] Twilio not configured, printing instead:");
    console.log(body);
    contacts.forEach((c) => console.log(`  -> ${c.name} (${c.phone})`));
    console.log("=================================");

    return contacts.map((c) => ({
      contactName: c.name,
      phone: c.phone,
      channel: "console",
      status: "logged",
    }));
  }

  // Send to every contact on every channel at the same time
  const jobs = [];
  for (const contact of contacts) {
    const to = toE164(contact.phone);
    for (const channel of channels) {
      if (!to) {
        jobs.push(
          Promise.resolve({
            contactName: contact.name,
            phone: contact.phone,
            channel,
            status: "failed",
            error: "Invalid phone number",
          })
        );
      } else {
        jobs.push(sendOne({ channel, to, body, contactName: contact.name }));
      }
    }
  }

  const results = await Promise.all(jobs);

  results
    .filter((r) => r.status === "failed")
    .forEach((r) =>
      console.error(`[notifications] ${r.channel} to ${r.contactName} failed: ${r.error}`)
    );

  return results;
}

export { buildSOSMessage };

export const sendSOSNotification = async ({ contacts, user, location, journey }) =>
  notifyContacts(contacts, buildSOSMessage({ user, location, journey }));

export const sendSafeNotification = async ({ contacts, user }) =>
  notifyContacts(contacts, buildSafeMessage({ user }));
