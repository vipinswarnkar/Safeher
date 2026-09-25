import SOS from "../models/sos.js";
import Journey from "../models/journey.js";
import Contact from "../models/contact.js";
import { sendSOSNotification } from "../services/notification.service.js";

// Trigger SOS
export const triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;

    // Validation (== null so a real coordinate of 0 is still accepted)
    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    // Attach the active journey if there is one. SOS must work even when
    // the user has not started a journey.
    const activeJourney = await Journey.findOne({
      user: req.user._id,
      status: "active",
    });

    // Get emergency contacts
    const contacts = await Contact.find({
      user: req.user._id,
    });

    if (contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one emergency contact",
      });
    }

    // Create SOS
    const sos = await SOS.create({
      user: req.user._id,
      journey: activeJourney ? activeJourney._id : null,
      latitude,
      longitude,
      message,
    });

    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // Notify contacts only after the SOS is saved, so a notification
    // failure never loses the alert record.
    try {
      await sendSOSNotification({
        contacts,
        user: req.user,
        location: { latitude, longitude, mapUrl },
        journey: activeJourney,
      });
    } catch (notifyError) {
      console.error("SOS Notification Error:", notifyError);
    }

    return res.status(201).json({
      success: true,
      message: "SOS triggered successfully",
      emergencyContacts: contacts.length,
      sos,
    });

  } catch (error) {
    console.error("Trigger SOS Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get SOS History
export const getSOSHistory = async (req, res) => {
  try {
    const sosHistory = await SOS.find({
      user: req.user._id,
    })
      .populate("journey", "source destination status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sosHistory.length,
      sosHistory,
    });

  } catch (error) {
    console.error("SOS History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Resolve SOS
export const resolveSOS = async (req, res) => {
  try {

    const { id } = req.params;

    const sos = await SOS.findOneAndUpdate(
      {
        _id: id,
        user: req.user._id,
      },
      {
        status: "resolved",
      },
      {
        returnDocument: "after",
      }
    );

    if (!sos) {
      return res.status(404).json({
        success: false,
        message: "SOS not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "SOS resolved successfully",
      sos,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};