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
      required: true,
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