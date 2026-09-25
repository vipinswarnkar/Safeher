import mongoose from "mongoose";
import { REPORT_TYPES } from "../validators/schemas.js";

// A community report of an unsafe spot (poor lighting, harassment, ...).
// Reports feed the area safety score and the safe-route recommender.
const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: REPORT_TYPES,
      required: true,
    },

    // 1 = minor, 2 = serious, 3 = dangerous
    severity: {
      type: Number,
      min: 1,
      max: 3,
      default: 2,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // GeoJSON point: coordinates are [longitude, latitude]
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
  },
  { timestamps: true }
);

// Enables fast "reports near here" queries
reportSchema.index({ location: "2dsphere" });
reportSchema.index({ createdAt: -1 });

reportSchema.virtual("latitude").get(function () {
  return this.location?.coordinates?.[1];
});
reportSchema.virtual("longitude").get(function () {
  return this.location?.coordinates?.[0];
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
