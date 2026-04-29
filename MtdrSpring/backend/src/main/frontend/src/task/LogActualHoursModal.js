import React, { useEffect, useState } from 'react';
import './task.css';

function LogActualHoursModal({
  open,
  taskName,
  assigneeName,
  loading = false,
  error = '',
  initialHours = '',
  onCancel,
  onConfirm,
}) {
  const [hours, setHours] = useState(initialHours === 0 ? '0' : (initialHours || ''));
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    setHours(initialHours === 0 ? '0' : (initialHours || ''));
    setLocalError('');
  }, [open, initialHours]);

  if (!open) return null;

  const handleSubmit = () => {
    const parsed = Number(hours);
    if (hours === '' || Number.isNaN(parsed) || parsed < 0) {
      setLocalError('Enter a valid number of hours.');
      return;
    }
    onConfirm && onConfirm(parsed);
  };

  return (
    <div className="TM-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onCancel?.()}>
      <div className="TM-modal TM-modal--compact">
        <div className="TM-header">
          <div className="TM-header-left">
            <span className="TM-tag">LOG ACTUAL HOURS</span>
            <h2 className="TM-title">{taskName || 'Complete task'}</h2>
          </div>
          <button className="TM-close" onClick={onCancel} aria-label="Close" disabled={loading}>
            x
          </button>
        </div>

        <div className="TM-compact-body">
          <p className="TM-helper">
            {assigneeName
              ? `Before moving this task to DONE, report how many hours ${assigneeName} actually spent.`
              : 'Before moving this task to DONE, report how many hours it actually took.'}
          </p>

          <div className="TM-field">
            <label className="TM-label">Actual Hours</label>
            <input
              className="TM-input"
              type="number"
              min={0}
              step={0.5}
              value={hours}
              onChange={(e) => {
                setHours(e.target.value);
                if (localError) setLocalError('');
              }}
              autoFocus
            />
          </div>

          {(localError || error) && <div className="TM-error">{localError || error}</div>}
        </div>

        <div className="TM-footer">
          <button className="TM-btn TM-btn--cancel" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="TM-btn TM-btn--submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Complete task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogActualHoursModal;