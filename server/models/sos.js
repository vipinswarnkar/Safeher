import mongoose from "mongoose";

const sosSchema = new mongoose.Schema(
  {
    // User who triggered SOS
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Journey during which SOS was triggered
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      default: null,
    },

    // Current Location
    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    // Optional message
    message: {
      type: String,
      default: "Emergency! I need help.",
    },

    // Delivery result for each contact and channel (sms / whatsapp)
    notifications: [
      {
        _id: false,
        contactName: String,
        phone: String,
        channel: String,
        status: { type: String, enum: ["sent", "failed", "logged"] },
        providerId: String,
        error: String,
      },
    ],

    // SOS Status
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const SOS = mongoose.model("SOS", sosSchema);

export default SOS;