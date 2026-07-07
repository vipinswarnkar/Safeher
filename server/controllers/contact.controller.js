import Contact from "../models/contact.js";

// Add Emergency Contact
export const addContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;

    // Validation
    if (!name || !phone || !relationship) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Create contact
    const contact = await Contact.create({
      user: req.user._id,
      name,
      phone,
      relationship,
    });

    return res.status(201).json({
      success: true,
      message: "Emergency contact added successfully",
      contact,
    });

  } catch (error) {
    console.error("Add Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get All Emergency Contacts
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });

  } catch (error) {
    console.error("Get Contacts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Update Emergency Contact
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findOneAndUpdate(
      {
        _id: id,
        user: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      contact,
    });

  } catch (error) {
    console.error("Update Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Delete Emergency Contact
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });

  } catch (error) {
    console.error("Delete Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};