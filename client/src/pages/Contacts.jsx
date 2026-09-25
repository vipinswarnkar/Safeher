import { useState } from "react";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePhone,
  HiOutlineUserGroup,
  HiOutlineXMark,
} from "react-icons/hi2";

import api from "../services/api";
import useApi from "../hooks/useApi";
import PageLayout, {
  LoadingState,
  EmptyState,
  ErrorState,
} from "../components/PageLayout";

const EMPTY_FORM = { name: "", phone: "", relationship: "" };
const RELATIONSHIPS = ["Mother", "Father", "Sister", "Brother", "Friend", "Partner", "Roommate"];

// Indian mobile numbers: optional +91 / 0, then 10 digits starting 6-9
const PHONE_PATTERN = /^(\+91[\s-]?|0)?[6-9]\d{9}$/;

function Contacts() {
  const { data, loading, error, reload } = useApi("/contacts");
  const contacts = data?.contacts ?? [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (contact) => {
    setForm({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    });
    setEditingId(contact._id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phone = form.phone.replace(/\s/g, "");
    if (!PHONE_PATTERN.test(phone)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form, phone };

      if (editingId) {
        await api.put(`/contacts/${editingId}`, payload);
        toast.success("Contact updated");
      } else {
        await api.post("/contacts", payload);
        toast.success("Contact added");
      }

      closeForm();
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Remove ${contact.name} from your trusted contacts?`)) {
      return;
    }

    try {
      await api.delete(`/contacts/${contact._id}`);
      toast.success("Contact removed");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove contact");
    }
  };

  return (
    <PageLayout
      title="Trusted Contacts"
      subtitle="These people get your SOS alerts and live location."
      action={
        !showForm && (
          <button
            type="button"
            onClick={openAddForm}
            className="shrink-0 w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition"
            aria-label="Add contact"
          >
            <HiOutlinePlus size={22} />
          </button>
        )
      }
    >
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {editingId ? "Edit contact" : "Add a contact"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close form"
            >
              <HiOutlineXMark size={22} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={updateField("name")}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
          />

          <input
            type="tel"
            placeholder="Mobile number"
            value={form.phone}
            onChange={updateField("phone")}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
          />

          <div>
            <input
              type="text"
              placeholder="Relationship"
              list="relationship-options"
              value={form.relationship}
              onChange={updateField("relationship")}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
            />
            <datalist id="relationship-options">
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white py-3 rounded-2xl font-semibold transition"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Add contact"}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={HiOutlineUserGroup}
          title="No trusted contacts yet"
          text="Add at least one person. SOS alerts can't be sent without a contact."
        />
      ) : (
        <ul className="space-y-3">
          {contacts.map((contact) => (
            <li
              key={contact._id}
              className="bg-white rounded-3xl shadow p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">
                {contact.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {contact.name}
                </p>
                <p className="text-sm text-slate-500">
                  {contact.relationship} · {contact.phone}
                </p>
              </div>

              <a
                href={`tel:${contact.phone}`}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                aria-label={`Call ${contact.name}`}
              >
                <HiOutlinePhone size={20} />
              </a>
              <button
                type="button"
                onClick={() => openEditForm(contact)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
                aria-label={`Edit ${contact.name}`}
              >
                <HiOutlinePencilSquare size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(contact)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                aria-label={`Delete ${contact.name}`}
              >
                <HiOutlineTrash size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}

export default Contacts;
