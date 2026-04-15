import React from 'react';
import NewTask from '../Tasks/NewTask';
import TaskList from '../Tasks/TaskList';
import { createTask, deleteTask, getTasks, updateTask } from '../Tasks/tasksApi';

export default function BacklogPage() {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (e) {
      setError(e?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload) {
    setError('');
    try {
      const created = await createTask(payload);
      // backend returns ID via header; created may contain only id, so reload for consistency.
      if (created?.id) setTasks((prev) => [{ ...payload, ...created }, ...prev]);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to create task');
    }
  }

  async function handleStatusChange(task, nextStatus) {
    setError('');
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        storyPoints: task.storyPoints,
        status: nextStatus,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    } catch (e) {
      setError(e?.message || 'Failed to update task');
    }
  }

  async function handleDelete(taskId) {
    setError('');
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) {
      setError(e?.message || 'Failed to delete task');
    }
  }

  return (
    <div className="v-stack">
      <div className="v-pageHeader">
        <div>
          <div className="v-pageHeader__eyebrow">SPRINT 2</div>
          <div className="v-pageHeader__sub">April 11 – April 23 (placeholder)</div>
        </div>
        <button className="v-btn v-btn--ghost" type="button">Complete sprint</button>
      </div>

      <NewTask onCreate={handleCreate} />

      {error ? <div className="v-alert v-alert--error">{error}</div> : null}

      <div className="v-card">
        <div className="v-card__title">Backlog</div>
        {loading ? (
          <div className="v-placeholder">Loading…</div>
        ) : (
          <TaskList tasks={tasks} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        )}
      </div>

      <div className="v-card">
        <div className="v-card__title">Create new sprint</div>
        <div className="v-placeholder">Sprint creation skeleton (to be implemented)</div>
      </div>
    </div>
  );
}
