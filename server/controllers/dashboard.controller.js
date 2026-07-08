import User from "../models/user.js";
import Journey from "../models/journey.js";
import Contact from "../models/contact.js";
import SOS from "../models/sos.js";
import Location from "../models/location.js";

export const getDashboard = async (req, res) => {
  try {
    // Get user details
    const user = await User.findById(req.user._id).select("-password");

    // Get active journey
    const activeJourney = await Journey.findOne({
      user: req.user._id,
      status: "active",
    });

    // Get latest location
    const latestLocation = await Location.findOne({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    // Count emergency contacts
    const contactsCount = await Contact.countDocuments({
      user: req.user._id,
    });

    // Count journeys
    const totalJourneys = await Journey.countDocuments({
      user: req.user._id,
    });

    // Count SOS alerts
    const totalSOS = await SOS.countDocuments({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      dashboard: {
        user,
        activeJourney,
        latestLocation,
        contactsCount,
        totalJourneys,
        totalSOS,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};