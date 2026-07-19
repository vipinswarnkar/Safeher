import Location from "../models/location.js";
import Journey from "../models/journey.js";

// Update Live Location
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed } = req.body;

   if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const activeJourney = await Journey.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!activeJourney) {
      return res.status(404).json({
        success: false,
        message: "No active journey found",
      });
    }

    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    const location = await Location.create({
      user: req.user._id,
      journey: activeJourney._id,
      latitude,
      longitude,
      accuracy,
      speed,
      mapUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Location Updated",
      location,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get Latest Location
export const getLatestLocation = async (req, res) => {
  try {

    const location = await Location.findOne({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    return res.status(200).json({
      success: true,
      location,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};