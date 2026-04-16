import React, { useState, useEffect } from 'react';
import './sprint.css';
import { FiClock } from "react-icons/fi";

const EMPTY_FORM = {
  sprintName: '',
  startDate: '',
  endDate: '',
  status: 'PLANNED',
  goal: '',
};

function CreateSprintModal({ open, onClose, onSprintCreated }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_FORM });
    setError('');
    setDuration(null);
  }, [open]);

  // Calcula duración en días en tiempo real
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
      setDuration(diff >= 0 ? diff : null);
    } else {
      setDuration(null);
    }
  }, [form.startDate, form.endDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.sprintName.trim()) { setError('Sprint name is required.'); return; }
    if (!form.startDate)         { setError('Start date is required.'); return; }
    if (!form.endDate)           { setError('End date is required.'); return; }
    if (duration !== null && duration < 0) { setError('End date must be after start date.'); return; }

    setLoading(true);
    try {
      const body = {
        sprintName:    form.sprintName.trim(),
        startDate:     form.startDate,
        endDate:       form.endDate,
        sprintDuration: duration ?? 0,
        status:        form.status,
        goal:          form.goal.trim() || null,
      };

      const res = await fetch('/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Server error ${res.status}`);
      }

      const created = await res.json();
      onSprintCreated && onSprintCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="SM-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="SM-modal">

        {/* Header */}
        <div className="SM-header">
          <div className="SM-header-left">
            <span className="SM-tag">NEW SPRINT</span>
            <h2 className="SM-title">Create Sprint</h2>
          </div>
          <button className="SM-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="SM-body">

          {/* Left — main fields */}
          <div className="SM-col SM-col--main">
            <div className="SM-field">
              <label className="SM-label">Sprint Name <span className="SM-required">*</span></label>
              <input
                className="SM-input"
                name="sprintName"
                placeholder="e.g. Sprint 3 — Auth & Dashboard"
                value={form.sprintName}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="SM-field">
              <label className="SM-label">Goal</label>
              <textarea
                className="SM-textarea"
                name="goal"
                placeholder="What should this sprint accomplish?"
                value={form.goal}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Duration pill */}
            {duration !== null && (
              <div className="SM-duration-pill">
                <span className="SM-duration-icon">
                  <FiClock size={18} color="#6b7280" />
                </span>
                <span><strong>{duration}</strong> day{duration !== 1 ? 's' : ''} duration</span>
              </div>
            )}
          </div>

          {/* Right — metadata */}
          <div className="SM-col SM-col--meta">
            <div className="SM-field">
              <label className="SM-label">Status</label>
              <select className="SM-select" name="status" value={form.status} onChange={handleChange}>
                <option value="PLANNED">PLANNED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div className="SM-field">
              <label className="SM-label">Start Date <span className="SM-required">*</span></label>
              <input
                className="SM-input"
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="SM-field">
              <label className="SM-label">End Date <span className="SM-required">*</span></label>
              <input
                className="SM-input"
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {error && <div className="SM-error">{error}</div>}

        <div className="SM-footer">
          <button className="SM-btn SM-btn--cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="SM-btn SM-btn--submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : '+ Create Sprint'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateSprintModal;