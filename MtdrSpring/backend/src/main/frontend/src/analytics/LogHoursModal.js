import React, { useState, useEffect } from 'react';
import '../task/task.css';

function LogHoursModal({ open, onClose, onConfirm, taskName }) {
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setHours(''); setError(''); }
  }, [open]);

  const handleConfirm = async () => {
    const h = parseFloat(hours);
    if (isNaN(h) || h < 0) { setError('Enter a valid number of hours (0 or more).'); return; }
    setLoading(true);
    await onConfirm(h);
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="TM-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '2px solid rgba(194,212,212,0.85)',
        boxShadow: '0 24px 64px rgba(30,50,36,0.18)',
        width: 'min(400px, 92vw)',
        padding: '28px 28px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'TM-slideUp 200ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        {/* Header */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '1px', color: '#4C825C', marginBottom: 4 }}>
            ✓ TASK COMPLETED
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#1E3224', lineHeight: 1.3 }}>
            {taskName}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(30,50,36,0.55)', marginTop: 6 }}>
            How many hours did you spend on this task?
          </div>
        </div>

        {/* Hours input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.6px', color: 'rgba(30,50,36,0.55)', textTransform: 'uppercase' }}>
            Hours worked
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g. 2.5"
              value={hours}
              onChange={e => { setHours(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              autoFocus
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1.5px solid rgba(30,50,36,0.16)',
                borderRadius: 10,
                fontSize: 18,
                fontWeight: 800,
                color: '#1E3224',
                outline: 'none',
                background: '#fff',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(30,50,36,0.50)' }}>hrs</span>
          </div>
          {error && <div style={{ fontSize: 12, color: '#C74634', fontWeight: 700 }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              appearance: 'none', border: '1px solid rgba(30,50,36,0.16)',
              background: '#fff', color: 'rgba(30,50,36,0.70)',
              borderRadius: 10, padding: '8px 18px',
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              appearance: 'none', border: 'none',
              background: '#4C825C', color: '#fff',
              borderRadius: 10, padding: '8px 20px',
              fontSize: 13, fontWeight: 900, cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving…' : 'Log hours'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogHoursModal;