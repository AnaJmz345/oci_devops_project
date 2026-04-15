import React from 'react';
import { getTasks } from '../Tasks/tasksApi';

function Column({ title, children }) {
  return (
    <div className="v-boardCol">
      <div className="v-boardCol__title">{title}</div>
      <div className="v-boardCol__body">{children}</div>
    </div>
  );
}

function TaskCard({ task }) {
  return (
    <div className="v-taskCard">
      <div className="v-taskCard__title">{task.title}</div>
      {task.description ? <div className="v-taskCard__desc">{task.description}</div> : null}
      <div className="v-taskCard__meta">
        {task.storyPoints != null ? <span>⏱ {task.storyPoints}h</span> : <span />}
        <span className={`v-status v-status--${(task.status || 'TODO').toLowerCase()}`}>{task.status}</span>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    getTasks()
      .then((data) => {
        if (alive) setTasks(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const grouped = React.useMemo(() => {
    const g = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of tasks) {
      const status = t.status || 'TODO';
      if (!g[status]) g[status] = [];
      g[status].push(t);
    }
    return g;
  }, [tasks]);

  return (
    <div className="v-stack">
      <div className="v-pageHeader">
        <div>
          <div className="v-pageHeader__eyebrow">BOARD</div>
          <div className="v-pageHeader__sub">Drag & drop skeleton (to be implemented)</div>
        </div>
      </div>

      {loading ? (
        <div className="v-placeholder">Loading…</div>
      ) : (
        <div className="v-board">
          <Column title={`TO DO (${grouped.TODO.length})`}>
            {grouped.TODO.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </Column>
          <Column title={`IN PROGRESS (${grouped.IN_PROGRESS.length})`}>
            {grouped.IN_PROGRESS.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </Column>
          <Column title={`DONE (${grouped.DONE.length})`}>
            {grouped.DONE.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </Column>
        </div>
      )}
    </div>
  );
}
