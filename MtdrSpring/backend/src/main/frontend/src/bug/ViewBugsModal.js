import React, { useState, useEffect } from 'react';
import '../task/task.css';

function ViewBugsModal({ open, onClose, task, userId, isManager, onBugsChanged }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(null);

  useEffect(() => {
    if (open && task) {
      setLoading(true);
      fetch(`/bugs/task/${task.taskId}`)
        .then(r => r.ok ? r.json() : [])
        .then(setBugs)
        .catch(() => setBugs([]))
        .finally(() => setLoading(false));
    }
  }, [open, task]);

  if (!open || !task) return null;

  const handleSolve = async (bugId) => {
    setSolving(bugId);
    try {
      const res = await fetch(`/bugs/${bugId}/solve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solvedBy: Number(userId) }),
      });
      if (res.ok) {
        setBugs(prev => prev.map(b =>
          b.bugId === bugId ? { ...b, solvedBy: Number(userId) } : b
        ));
        onBugsChanged && onBugsChanged();
      }
    } catch (err) {
      console.error('Error solving bug:', err);
    } finally {
      setSolving(null);
    }
  };

  const openBugs = bugs.filter(b => b.solvedBy == null);
  const solvedBugs = bugs.filter(b => b.solvedBy != null);

  return (
    <div className="TM-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="TM-modal" style={{ width: 'min(560px, 94vw)' }}>
        <div className="TM-header">
          <div className="TM-header-left">
            <span className="TM-tag">DEFECT LOG</span>
            <h2 className="TM-title">{task.taskName}</h2>
          </div>
          <button className="TM-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'rgba(30,50,36,0.4)', padding: 20 }}>Loading bugs…</div>
          ) : bugs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(30,50,36,0.4)', padding: 20 }}>No bugs reported for this task.</div>
          ) : (
            <>
              {/* Summary pills */}
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900,
                  background: 'rgba(199,70,52,0.10)', color: '#C74634',
                }}>
                  {openBugs.length} Open
                </span>
                <span style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900,
                  background: 'rgba(76,130,92,0.12)', color: '#4C825C',
                }}>
                  {solvedBugs.length} Solved
                </span>
              </div>

              {/* Open bugs */}
              {openBugs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.8px', color: '#C74634', textTransform: 'uppercase' }}>
                    Open
                  </span>
                  {openBugs.map(bug => (
                    <div key={bug.bugId} style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                      padding: '10px 14px',
                      background: 'rgba(199,70,52,0.04)',
                      border: '1px solid rgba(199,70,52,0.15)',
                      borderRadius: 10,
                    }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1E3224' }}>
                          {bug.description}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(30,50,36,0.45)' }}>
                          Bug #{bug.bugId}
                        </span>
                      </div>
                      {!isManager && (
                        <button
                          onClick={() => handleSolve(bug.bugId)}
                          disabled={solving === bug.bugId}
                          style={{
                            appearance: 'none',
                            border: '1px solid rgba(76,130,92,0.35)',
                            background: 'rgba(76,130,92,0.08)',
                            borderRadius: 8,
                            padding: '5px 12px',
                            cursor: 'pointer',
                            color: '#4C825C',
                            fontSize: 11,
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            transition: 'background 120ms',
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,130,92,0.18)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(76,130,92,0.08)'; }}
                        >
                          {solving === bug.bugId ? 'Solving…' : '✓ Mark Solved'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Solved bugs */}
              {solvedBugs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.8px', color: '#4C825C', textTransform: 'uppercase' }}>
                    Solved
                  </span>
                  {solvedBugs.map(bug => (
                    <div key={bug.bugId} style={{
                      padding: '10px 14px',
                      background: 'rgba(76,130,92,0.04)',
                      border: '1px solid rgba(76,130,92,0.12)',
                      borderRadius: 10,
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(30,50,36,0.55)', textDecoration: 'line-through' }}>
                          {bug.description}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(30,50,36,0.35)' }}>
                          Bug #{bug.bugId} — solved
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="TM-footer">
          <button className="TM-btn TM-btn--cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ViewBugsModal;