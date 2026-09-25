import express from "express";
import {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
} from "../controllers/contact.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { contactSchema, contactUpdateSchema, objectIdParam } from "../validators/schemas.js";

const router = express.Router();

router.post("/", protect, validate({ body: contactSchema }), addContact);
router.get("/", protect, getContacts);
router.put("/:id", protect, validate({ params: objectIdParam, body: contactUpdateSchema }), updateContact);
router.delete("/:id", protect, validate({ params: objectIdParam }), deleteContact);

export default router;
