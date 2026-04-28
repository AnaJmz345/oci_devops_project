import React, { useState } from 'react';
import '../task/task.css';

function ReportBugModal({ open, onClose, task, userId, onBugCreated }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open || !task) return null;

  const handleSubmit = async () => {
    setError('');
    if (!description.trim()) {
      setError('Bug description is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.taskId,
          reportedBy: Number(userId),
          solvedBy: null,
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Server error ${res.status}`);
      }

      const created = await res.json();
      onBugCreated && onBugCreated(created);
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="TM-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="TM-modal" style={{ width: 'min(520px, 94vw)' }}>
        <div className="TM-header">
          <div className="TM-header-left">
            <span className="TM-tag">REPORT BUG</span>
            <h2 className="TM-title">Register Defect</h2>
          </div>
          <button className="TM-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Task info */}
          <div style={{
            background: 'rgba(194,212,212,0.12)',
            border: '1px solid rgba(194,212,212,0.5)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.8px', color: 'rgba(30,50,36,0.5)', textTransform: 'uppercase' }}>
              Associated Task
            </span>
            <span style={{ fontWeight: 800, color: '#1E3224', fontSize: 14 }}>
              {task.taskName}
            </span>
            {task.description && (
              <span style={{ fontSize: 12, color: 'rgba(30,50,36,0.55)' }}>
                {task.description}
              </span>
            )}
          </div>

          {/* Bug description */}
          <div className="TM-field">
            <label className="TM-label">Bug Description <span className="TM-required">*</span></label>
            <textarea
              className="TM-textarea"
              placeholder="Describe the error or defect found in this task…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>
        </div>

        {error && <div className="TM-error">{error}</div>}

        <div className="TM-footer">
          <button className="TM-btn TM-btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="TM-btn TM-btn--submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Reporting…' : 'Report Bug'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportBugModal;