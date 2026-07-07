import Journey from "../models/journey.js";

// Start a Journey
export const startJourney = async (req, res) => {
  try {
    const { source, destination } = req.body;

    // Validation
    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: "Source and destination are required",
      });
    }

    // Check if user already has an active journey
    const activeJourney = await Journey.findOne({
      user: req.user._id,
      status: "active",
    });

    if (activeJourney) {
      return res.status(400).json({
        success: false,
        message: "You already have an active journey",
      });
    }

    // Create new journey
    const journey = await Journey.create({
      user: req.user._id,
      source,
      destination,
    });

    return res.status(201).json({
      success: true,
      message: "Journey started successfully",
      journey,
    });

  } catch (error) {
    console.error("Start Journey Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Get Active Journey
export const getActiveJourney = async (req, res) => {
  try {
    const journey = await Journey.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: "No active journey found",
      });
    }

    return res.status(200).json({
      success: true,
      journey,
    });

  } catch (error) {
    console.error("Get Active Journey Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// End Journey
export const endJourney = async (req, res) => {
  try {
    const { id } = req.params;

    const journey = await Journey.findOneAndUpdate(
      {
        _id: id,
        user: req.user._id,
        status: "active",
      },
      {
        status: "completed",
        endedAt: new Date(),
      },
      {
        new: true,
      }
    );

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: "Active journey not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Journey ended successfully",
      journey,
    });

  } catch (error) {
    console.error("End Journey Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get Journey History
export const getJourneyHistory = async (req, res) => {
  try {
    const journeys = await Journey.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: journeys.length,
      journeys,
    });

  } catch (error) {
    console.error("Journey History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};