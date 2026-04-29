import React, { useState, useEffect } from 'react';
import './task.css';

const EMPTY_FORM = {
  task_name: '',
  description: '',
  status: 'TODO',
  category: 'FEATURE',
  story_points: 1,
  due_date: '',
  sprint_id: '',
  assignee_oracle_id: '',
  estimated_completion_time: '',
  additional_comments: '',
};

function CreateTaskModal({ open, onClose, onTaskCreated, sprintId, createdBy }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, sprint_id: sprintId || '' });
  const [developers, setDevelopers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_FORM, sprint_id: sprintId || '' });
    setError('');

    // Fetch developers - normalizamos oracle_id por si el backend devuelve oracleId
    fetch('/users/developers')
      .then(r => r.ok ? r.json() : [])
      .then(data => setDevelopers(data.map(d => ({
        ...d,
        oracle_id: d.oracle_id ?? d.oracleId,
      }))))
      .catch(() => setDevelopers([]));

    // Fetch sprints - ignorar 404 si el endpoint no existe aún
    fetch('/sprints')
      .then(r => r.ok ? r.json() : [])
      .then(setSprints)
      .catch(() => setSprints([]));
  }, [open, sprintId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.task_name.trim()) { setError('Task name is required.'); return; }
    if (!form.due_date)         { setError('Due date is required.'); return; }
    if (!form.assignee_oracle_id) { setError('You must assign this task to a developer.'); return; }
    if (!createdBy)             { setError('Session error: user ID not found. Please log out and log in again.'); return; }

    setLoading(true);
    try {
      // 1. Crear la task — usamos camelCase para que coincida con los setters de Java
      const taskBody = {
        taskName:    form.task_name.trim(),
        description: form.description.trim(),
        status:      form.status,
        category:    form.category,
        storyPoints: Number(form.story_points) || 1,
        dueDate:     form.due_date,
        sprintId:    form.sprint_id ? Number(form.sprint_id) : null,
        createdBy:   Number(createdBy),
      };

      const taskRes = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskBody),
      });

      if (!taskRes.ok) {
        const msg = await taskRes.text().catch(() => '');
        throw new Error(msg || `Server error ${taskRes.status}`);
      }

      const createdTask = await taskRes.json();
      // El backend devuelve taskId (camelCase desde el getter getTaskId())
      const taskId = createdTask.taskId ?? createdTask.task_id ?? createdTask.id;

      // 2. Asignar la task al developer seleccionado
      const assignBody = {
        taskId:                  taskId,
        oracleId:                Number(form.assignee_oracle_id),
        estimatedCompletionTime: form.estimated_completion_time ? Number(form.estimated_completion_time) : null,
        additionalComments:      form.additional_comments.trim() || null,
        realTimeSpent:           0,
      };

      await fetch('/tasks/assignees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignBody),
      });

      onTaskCreated && onTaskCreated(createdTask);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="TM-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="TM-modal">
        <div className="TM-header">
          <div className="TM-header-left">
            <span className="TM-tag">NEW TASK</span>
            <h2 className="TM-title">Create Task</h2>
          </div>
          <button className="TM-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="TM-body">
          <div className="TM-col TM-col--main">
            <div className="TM-field">
              <label className="TM-label">Task Name <span className="TM-required">*</span></label>
              <input className="TM-input" name="task_name"
                placeholder="e.g. Implement login endpoint…"
                value={form.task_name} onChange={handleChange} autoFocus />
            </div>

            <div className="TM-field">
              <label className="TM-label">Description</label>
              <textarea className="TM-textarea" name="description"
                placeholder="Describe what needs to be done…"
                value={form.description} onChange={handleChange} rows={4} />
            </div>

            <div className="TM-field">
              <label className="TM-label">Assignee <span className="TM-required">*</span></label>
              <select className="TM-select" name="assignee_oracle_id"
                value={form.assignee_oracle_id} onChange={handleChange}>
                <option value="">— Select developer —</option>
                {developers.map(dev => (
                  <option key={dev.oracle_id} value={dev.oracle_id}>
                    {dev.name} ({dev.mail})
                  </option>
                ))}
              </select>
            </div>

            <div className="TM-field">
              <label className="TM-label">Additional Comments for Assignee</label>
              <textarea className="TM-textarea" name="additional_comments"
                placeholder="Any notes for the assignee…"
                value={form.additional_comments} onChange={handleChange} rows={2} />
            </div>
          </div>

          <div className="TM-col TM-col--meta">
            <div className="TM-field">
              <label className="TM-label">Status</label>
              <select className="TM-select" name="status" value={form.status} onChange={handleChange}>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="DONE">DONE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>

            <div className="TM-field">
              <label className="TM-label">Category</label>
              <select className="TM-select" name="category" value={form.category} onChange={handleChange}>
                <option value="FEATURE">FEATURE</option>
                <option value="BUG">BUG</option>
                <option value="ISSUE">ISSUE</option>
              </select>
            </div>

            <div className="TM-field">
              <label className="TM-label">Sprint</label>
              <select className="TM-select" name="sprint_id" value={form.sprint_id} onChange={handleChange}>
                <option value="">— Backlog (no sprint) —</option>
                {sprints.map(s => (
                  <option key={s.sprintId ?? s.sprint_id} value={s.sprintId ?? s.sprint_id}>
                    {s.sprintName ?? s.sprint_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="TM-row">
              <div className="TM-field">
                <label className="TM-label">Story Points</label>
                <input className="TM-input" type="number" name="story_points"
                  min={1} max={100} value={form.story_points} onChange={handleChange} />
              </div>
              <div className="TM-field">
                <label className="TM-label">Est. Time (h)</label>
                <input className="TM-input" type="number" name="estimated_completion_time"
                  min={0} placeholder="—" value={form.estimated_completion_time} onChange={handleChange} />
              </div>
            </div>

            <div className="TM-field">
              <label className="TM-label">Due Date <span className="TM-required">*</span></label>
              <input className="TM-input" type="date" name="due_date"
                value={form.due_date} onChange={handleChange} />
            </div>
          </div>
        </div>

        {error && <div className="TM-error">{error}</div>}

        <div className="TM-footer">
          <button className="TM-btn TM-btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="TM-btn TM-btn--submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : '+ Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateTaskModal;