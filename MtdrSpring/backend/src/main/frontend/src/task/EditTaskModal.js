import React, { useState, useEffect } from 'react';
import { BsTrash3 } from 'react-icons/bs';
import './task.css';

function EditTaskModal({ open, onClose, onTaskUpdated, onTaskDeleted, task, sprints, users = [] }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [assignee, setAssignee] = useState(null);

  const developers = users.filter(u => u.role === 'DEVELOPER');

  useEffect(() => {
    if (!open || !task) return;
    setError('');
    setConfirmDelete(task._confirmDelete === true);
    setAssignee(null);
    setForm({
      taskName:    task.taskName    || '',
      description: task.description || '',
      status:      task.status      || 'TODO',
      category:    task.category    || 'FEATURE',
      storyPoints: task.storyPoints ?? 1,
      dueDate:     task.dueDate ? String(task.dueDate).split('T')[0] : '',
      sprintId:    task.sprintId != null ? String(task.sprintId) : '',
      newAssigneeOracleId: '',
      estimatedCompletionTime: '',
    });

    // Fetch current assignee
    fetch(`/tasks/${task.taskId}/assignees`)
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        if (list.length > 0) {
          setAssignee(list[0]);
          setForm(prev => ({
            ...prev,
            newAssigneeOracleId: String(list[0].oracleId),
            estimatedCompletionTime: list[0].estimatedCompletionTime ?? '',
          }));
        }
      })
      .catch(() => {});
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
      // 1. Update task fields
      const body = {
        taskName:    form.taskName.trim(),
        description: form.description.trim(),
        status:      form.status,
        category:    form.category,
        storyPoints: Number(form.storyPoints) || 1,
        dueDate:     form.dueDate,
        sprintId:    form.sprintId ? Number(form.sprintId) : null,
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

      // 2. Handle assignee change
      const newOracleId = form.newAssigneeOracleId ? Number(form.newAssigneeOracleId) : null;
      const currentOracleId = assignee ? assignee.oracleId : null;

      if (newOracleId && newOracleId !== currentOracleId) {
        // Delete old assignee if exists
        if (currentOracleId) {
          await fetch(`/tasks/assignees/${task.taskId}/${currentOracleId}`, {
            method: 'DELETE',
          }).catch(() => {});
        }
        // Create new assignee
        const est = parseFloat(form.estimatedCompletionTime);
        await fetch('/tasks/assignees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.taskId,
            oracleId: newOracleId,
            estimatedCompletionTime: isNaN(est) ? null : est,
            realTimeSpent: 0,
          }),
        }).catch(() => {});
      } else if (assignee && form.estimatedCompletionTime !== '') {
        // Same assignee, just update estimated time
        const est = parseFloat(form.estimatedCompletionTime);
        if (!isNaN(est)) {
          await fetch(`/tasks/assignees/${task.taskId}/${currentOracleId}/hours`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estimatedCompletionTime: est }),
          }).catch(() => {});
        }
      }

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

        <div className="TM-header">
          <div className="TM-header-left">
            <span className="TM-tag">EDIT TASK</span>
            <h2 className="TM-title">{task.taskName}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!confirmDelete ? (
              <button className="TM-close" onClick={() => setConfirmDelete(true)} title="Delete task"
                style={{ color: '#C74634', borderColor: 'rgba(199,70,52,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BsTrash3 size={15} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#C74634' }}>Delete?</span>
                <button className="TM-btn TM-btn--submit" style={{ padding: '5px 12px', fontSize: 12 }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? '…' : 'Yes'}
                </button>
                <button className="TM-btn TM-btn--cancel" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setConfirmDelete(false)}>
                  No
                </button>
              </div>
            )}
            <button className="TM-close" onClick={onClose} aria-label="Close"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        <div className="TM-body">
          <div className="TM-col TM-col--main">
            <div className="TM-field">
              <label className="TM-label">Task Name <span className="TM-required">*</span></label>
              <input className="TM-input" name="taskName" value={form.taskName || ''} onChange={handleChange} autoFocus />
            </div>
            <div className="TM-field">
              <label className="TM-label">Description</label>
              <textarea className="TM-textarea" name="description" value={form.description || ''} onChange={handleChange} rows={4} />
            </div>
            <div className="TM-field">
              <label className="TM-label">Assignee</label>
              <select className="TM-select" name="newAssigneeOracleId" value={form.newAssigneeOracleId || ''} onChange={handleChange}>
                <option value="">— Unassigned —</option>
                {developers.map(dev => (
                  <option key={dev.oracleId} value={String(dev.oracleId)}>
                    {dev.name} ({dev.mail})
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                  <option key={s.sprintId} value={String(s.sprintId)}>{s.sprintName}</option>
                ))}
              </select>
            </div>
            <div className="TM-row">
              <div className="TM-field">
                <label className="TM-label">Story Points</label>
                <input className="TM-input" type="number" name="storyPoints" min={1} max={100} value={form.storyPoints ?? 1} onChange={handleChange} />
              </div>
              <div className="TM-field">
                <label className="TM-label">Est. Time (h)</label>
                <input className="TM-input" type="number" name="estimatedCompletionTime" min={0} step={0.5}
                  placeholder="—" value={form.estimatedCompletionTime} onChange={handleChange} />
              </div>
            </div>
            <div className="TM-field">
              <label className="TM-label">Due Date <span className="TM-required">*</span></label>
              <input className="TM-input" type="date" name="dueDate" value={form.dueDate || ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        {error && <div className="TM-error">{error}</div>}

        <div className="TM-footer">
          <button className="TM-btn TM-btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="TM-btn TM-btn--submit" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditTaskModal;