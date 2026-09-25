import mongoose from "mongoose";

// Reusable lat/lng pair (optional so old journeys still validate)
const pointSchema = new mongoose.Schema(
  {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const journeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    source: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    sourceLocation: {
      type: pointSchema,
      default: undefined,
    },

    destinationLocation: {
      type: pointSchema,
      default: undefined,
    },

    // Route the user picked in the safe-route planner, [lng, lat] pairs
    plannedRoute: {
      type: [[Number]],
      default: undefined,
    },

    expectedDurationSec: {
      type: Number,
    },

    routeSafetyScore: {
      type: Number,
    },

    // Secret part of the public live-tracking link (/track/:shareToken)
    shareToken: {
      type: String,
      index: { unique: true, sparse: true },
    },

    // Smart alerts raised during the journey and whether she replied
    alerts: [
      {
        _id: false,
        type: { type: String },
        message: String,
        at: { type: Date, default: Date.now },
        acknowledgedAt: Date,
      },
    ],

    lastCheckInAt: {
      type: Date,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Journey = mongoose.model("Journey", journeySchema);

export default Journey;