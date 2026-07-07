import express from "express";
import {
  addContact,
  getContacts,
  updateContact,
  deleteContact
} from "../controllers/contact.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Add Emergency Contact
router.post("/", protect, addContact);

// Get All Emergency Contacts
router.get("/", protect, getContacts);

router.put("/:id", protect, updateContact)

router.delete("/:id", protect, deleteContact)

export default router;