import React, { useState, useEffect } from 'react';
import './task.css';

function EditTaskModal({ open, onClose, onTaskUpdated, onTaskDeleted, task, sprints }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !task) return;
    setError('');
    setConfirmDelete(false);
    setForm({
      taskName:    task.taskName    || '',
      description: task.description || '',
      status:      task.status      || 'TODO',
      category:    task.category    || 'FEATURE',
      storyPoints: task.storyPoints ?? 1,
      dueDate:     task.dueDate ? String(task.dueDate).split('T')[0] : '',
      sprintId:    task.sprintId != null ? String(task.sprintId) : '',
    });
  }, [open, task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.taskName.trim()) { setError('Task name is required.'); return; }
    if (!form.dueDate)         { setError('Due date is required.'); return; }

    setLoading(true);
    try {
      const body = {
        taskName:    form.taskName.trim(),
        description: form.description.trim(),
        status:      form.status,
        category:    form.category,
        storyPoints: Number(form.storyPoints) || 1,
        dueDate:     form.dueDate,
        sprintId:    form.sprintId ? Number(form.sprintId) : null,
        createdBy:   task.createdBy,
      };

      const res = await fetch(`/tasks/${task.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Server error ${res.status}`);
      }

      const updated = await res.json();
      onTaskUpdated && onTaskUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/tasks/${task.taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      onTaskDeleted && onTaskDeleted(task.taskId);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not delete task.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!open || !task) return null;

  return (
    <div className="TM-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="TM-modal">

        {/* Header */}
        <div className="TM-header">
          <div className="TM-header-left">
            <span className="TM-tag">EDIT TASK</span>
            <h2 className="TM-title">{task.taskName}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Delete button */}
            {!confirmDelete ? (
              <button
                className="TM-close"
                onClick={() => setConfirmDelete(true)}
                title="Delete task"
                style={{ color: '#C74634', borderColor: 'rgba(199,70,52,0.30)' }}
              >
                🗑
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#C74634' }}>Delete?</span>
                <button
                  className="TM-btn TM-btn--submit"
                  style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '…' : 'Yes'}
                </button>
                <button
                  className="TM-btn TM-btn--cancel"
                  style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={() => setConfirmDelete(false)}
                >
                  No
                </button>
              </div>
            )}
            <button className="TM-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="TM-body">

          {/* Left col */}
          <div className="TM-col TM-col--main">
            <div className="TM-field">
              <label className="TM-label">Task Name <span className="TM-required">*</span></label>
              <input
                className="TM-input"
                name="taskName"
                value={form.taskName || ''}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="TM-field">
              <label className="TM-label">Description</label>
              <textarea
                className="TM-textarea"
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </div>

          {/* Right col */}
          <div className="TM-col TM-col--meta">
            <div className="TM-field">
              <label className="TM-label">Status</label>
              <select className="TM-select" name="status" value={form.status || 'TODO'} onChange={handleChange}>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="DONE">DONE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>

            <div className="TM-field">
              <label className="TM-label">Category</label>
              <select className="TM-select" name="category" value={form.category || 'FEATURE'} onChange={handleChange}>
                <option value="FEATURE">FEATURE</option>
                <option value="BUG">BUG</option>
                <option value="ISSUE">ISSUE</option>
              </select>
            </div>

            <div className="TM-field">
              <label className="TM-label">Sprint</label>
              <select className="TM-select" name="sprintId" value={form.sprintId || ''} onChange={handleChange}>
                <option value="">— Backlog (no sprint) —</option>
                {(sprints || []).map(s => (
                  <option key={s.sprintId} value={String(s.sprintId)}>
                    {s.sprintName}
                  </option>
                ))}
              </select>
            </div>

            <div className="TM-row">
              <div className="TM-field">
                <label className="TM-label">Story Points</label>
                <input
                  className="TM-input"
                  type="number"
                  name="storyPoints"
                  min={1}
                  max={100}
                  value={form.storyPoints ?? 1}
                  onChange={handleChange}
                />
              </div>
              <div className="TM-field">
                <label className="TM-label">Due Date <span className="TM-required">*</span></label>
                <input
                  className="TM-input"
                  type="date"
                  name="dueDate"
                  value={form.dueDate || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <div className="TM-error">{error}</div>}

        <div className="TM-footer">
          <button className="TM-btn TM-btn--cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="TM-btn TM-btn--submit" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditTaskModal;