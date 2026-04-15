import React from 'react';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'TO DO' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { value: 'DONE', label: 'DONE' },
];

export default function TaskList({ tasks, onStatusChange, onDelete }) {
  if (!tasks?.length) {
    return <div className="v-placeholder">No tasks yet.</div>;
  }

  return (
    <div className="v-table">
      <div className="v-table__head">
        <div>Task</div>
        <div>Status</div>
        <div className="v-table__num">Hours</div>
        <div className="v-table__actions" />
      </div>
      {tasks.map((t) => (
        <div key={t.id} className="v-table__row">
          <div>
            <div className="v-taskTitle">{t.title || '(untitled)'}</div>
            {t.description ? <div className="v-taskDesc">{t.description}</div> : null}
          </div>
          <div>
            <select
              className="v-select"
              value={t.status || 'TODO'}
              onChange={(e) => onStatusChange?.(t, e.target.value)}
              aria-label={`Status for task ${t.id}`}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="v-table__num">{t.storyPoints != null ? t.storyPoints : '—'}</div>
          <div className="v-table__actions">
            <button className="v-btn v-btn--ghost" type="button" onClick={() => onDelete?.(t.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
