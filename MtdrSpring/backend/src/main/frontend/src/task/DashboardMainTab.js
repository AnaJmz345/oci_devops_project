import React, { useState } from 'react';

function DashboardMainTab({
  activeSprintId,
  backlogTasks,
  setBacklogTasks,
  sprints,
  users,
  taskAssignees,
}) {
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [updating, setUpdating] = useState(null);

  const COLUMNS = [
    { status: 'TODO',        label: 'TO DO',        color: '#1E3224',  accent: 'rgba(30,50,36,0.08)' },
    { status: 'IN_PROGRESS', label: 'IN PROGRESS',  color: '#9a6c00',  accent: 'rgba(241,177,63,0.18)' },
    { status: 'DONE',        label: 'DONE',         color: '#2d6b3f',  accent: 'rgba(76,130,92,0.18)' },
    { status: 'BLOCKED',     label: 'BLOCKED',      color: '#C74634',  accent: 'rgba(199,70,52,0.15)' },
  ];

  const showAllSprints = activeSprintId === 'all';
  const filteredTasks = showAllSprints
    ? backlogTasks.filter(t => t.sprintId != null)
    : backlogTasks.filter(t => String(t.sprintId) === String(activeSprintId));

  const getAssigneeName = (taskId) => {
    const assignee = taskAssignees[taskId];
    if (!assignee) return null;
    const u = users.find(usr => String(usr.oracleId) === String(assignee.oracleId));
    return u ? u.name.split(' ')[0] : null;
  };

  const getSprintName = (sprintId) => {
    if (!sprintId) return null;
    const found = sprints.find(s => String(s.sprintId) === String(sprintId));
    return found ? found.sprintName : null;
  };

  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(taskId));
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = Number(e.dataTransfer.getData('text/plain')) || draggingTaskId;
    setDraggingTaskId(null);

    const task = backlogTasks.find(t => t.taskId === taskId);
    if (!task || task.status === newStatus) return;

    setBacklogTasks(prev => prev.map(t =>
      t.taskId === taskId ? { ...t, status: newStatus } : t
    ));

    setUpdating(taskId);
    try {
      const res = await fetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName:    task.taskName,
          description: task.description,
          status:      newStatus,
          category:    task.category,
          storyPoints: task.storyPoints,
          dueDate:     task.dueDate,
          sprintId:    task.sprintId,
        }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch (err) {
      setBacklogTasks(prev => prev.map(t =>
        t.taskId === taskId ? { ...t, status: task.status } : t
      ));
      console.error('Error updating task status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverCol(null);
  };

  return (
    <div className="VantagePage">
      <div className="VantagePageHeader">
        <h1 className="VantageH1">Board</h1>
        <div className="VantageMuted">Drag tasks between columns to update their status</div>
      </div>

      <div className="KB-board">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);
          const isOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              className={`KB-column ${isOver ? 'KB-column--over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className="KB-column-header">
                <span className="KB-column-dot" style={{ background: col.color }} />
                <span className="KB-column-title" style={{ color: col.color }}>{col.label}</span>
                <span className="KB-column-count">{colTasks.length}</span>
              </div>

              <div className="KB-column-body">
                {colTasks.length === 0 && !isOver && (
                  <div className="KB-empty">No tasks</div>
                )}

                {colTasks.map(task => {
                  const isDragging = draggingTaskId === task.taskId;
                  const isUpdating = updating === task.taskId;
                  const assigneeName = getAssigneeName(task.taskId);
                  const sprintName = showAllSprints ? getSprintName(task.sprintId) : null;

                  return (
                    <div
                      key={task.taskId}
                      className={`KB-card ${isDragging ? 'KB-card--dragging' : ''} ${isUpdating ? 'KB-card--updating' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.taskId)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="KB-card-tags">
                        <span className={`KB-tag KB-tag--${task.category?.toLowerCase() || 'feature'}`}>
                          {task.category || 'FEATURE'}
                        </span>
                        {sprintName && (
                          <span className="KB-tag KB-tag--sprint">{sprintName}</span>
                        )}
                      </div>

                      <div className="KB-card-title">{task.taskName}</div>

                      {task.description && (
                        <div className="KB-card-desc">{task.description}</div>
                      )}

                      <div className="KB-card-footer">
                        {assigneeName ? (
                          <span className="KB-card-assignee">
                            <span className="KB-card-avatar">{assigneeName[0]}</span>
                            {assigneeName}
                          </span>
                        ) : (
                          <span className="KB-card-unassigned">Unassigned</span>
                        )}
                        {task.storyPoints != null && (
                          <span className="KB-card-points">{task.storyPoints} pts</span>
                        )}
                      </div>

                      {isUpdating && <div className="KB-card-loader" />}
                    </div>
                  );
                })}

                {isOver && (
                  <div className="KB-drop-hint">Drop here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardMainTab;