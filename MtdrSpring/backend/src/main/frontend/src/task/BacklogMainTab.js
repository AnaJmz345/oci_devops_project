import React from 'react';
import { IoMdAddCircle } from 'react-icons/io';
import { FaEdit } from 'react-icons/fa';
import { BsTrash3 } from 'react-icons/bs';

function BacklogMainTab({
  activeProjectName,
  activeSprintLabel,
  activeSprintId,
  backlogTasks,
  setBacklogTasks,
  backlogLoading,
  sprints,
  users,
  taskAssignees,
  setTaskAssignees,
  isManager,
  assignMode,
  setAssignMode,
  selectedTaskIds,
  setSelectedTaskIds,
  assignSprintId,
  setAssignSprintId,
  assigning,
  setAssigning,
  fetchBacklogTasks,
  setIsCreateTaskOpen,
  setIsCreateSprintOpen,
  setEditingTask,
}) {
  const STATUS_COLORS = {
    'TODO':        { background: 'rgba(30,50,36,0.08)', color: '#1E3224' },
    'IN_PROGRESS': { background: 'rgba(241,177,63,0.18)', color: '#9a6c00' },
    'DONE':        { background: 'rgba(76,130,92,0.18)', color: '#2d6b3f' },
    'BLOCKED':     { background: 'rgba(199,70,52,0.15)', color: '#C74634' },
  };

  const showAllSprints = activeSprintId === 'all';

  const filteredTasks = showAllSprints
    ? backlogTasks
    : backlogTasks.filter(t => String(t.sprintId) === String(activeSprintId));

  const getSprintName = (sprintId) => {
    if (!sprintId) return 'Not assigned';
    const found = sprints.find(s => String(s.sprintId) === String(sprintId));
    return found ? found.sprintName : `Sprint #${sprintId}`;
  };

  const getAssigneeName = (taskId) => {
    const assignee = taskAssignees[taskId];
    if (!assignee) return null;
    const u = users.find(u => String(u.oracleId) === String(assignee.oracleId));
    return u ? u.name.split(' ')[0] : null;
  };

  const toggleSelectTask = (taskId) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.taskId)));
    }
  };

  const handleAssignSprint = async () => {
    if (!assignSprintId || selectedTaskIds.size === 0) return;
    setAssigning(true);
    try {
      await Promise.all([...selectedTaskIds].map(taskId => {
        const task = backlogTasks.find(t => t.taskId === taskId);
        if (!task) return Promise.resolve();
        return fetch(`/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskName:    task.taskName,
            description: task.description,
            status:      task.status,
            category:    task.category,
            storyPoints: task.storyPoints,
            dueDate:     task.dueDate,
            sprintId:    Number(assignSprintId),
          }),
        });
      }));
      await fetchBacklogTasks();
      setSelectedTaskIds(new Set());
      setAssignMode(false);
      setAssignSprintId('');
    } catch (e) {
      console.error('Error assigning sprint:', e);
    } finally {
      setAssigning(false);
    }
  };

  const cancelAssignMode = () => {
    setAssignMode(false);
    setSelectedTaskIds(new Set());
    setAssignSprintId('');
  };

  const allSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;

  return (
    <div className="VantagePage">
      <div className="VantagePageHeader">
        <h1 className="VantageH1">Backlog</h1>
        <div className="VantageMuted">Project: {activeProjectName} • Sprint: {activeSprintLabel}</div>
      </div>
      <div className="VantageCard">
        <div className="VantageCardTitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>
            Backlog items
            {filteredTasks.length > 0 && (
              <span style={{ fontWeight: 500, color: 'rgba(30,50,36,0.5)', fontSize: 13 }}>
                {' '}({filteredTasks.length})
              </span>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {assignMode ? (
              <>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(30,50,36,0.6)' }}>
                  {selectedTaskIds.size} selected
                </span>
                <select
                  value={assignSprintId}
                  onChange={e => setAssignSprintId(e.target.value)}
                  style={{
                    height: 32, border: '1.5px solid rgba(30,50,36,0.20)',
                    borderRadius: 8, padding: '0 10px', fontSize: 12,
                    fontWeight: 700, color: '#1E3224', background: '#fff',
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="">— Select sprint —</option>
                  {sprints.map(s => (
                    <option key={s.sprintId} value={s.sprintId}>{s.sprintName}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignSprint}
                  disabled={assigning || !assignSprintId || selectedTaskIds.size === 0}
                  style={{
                    appearance: 'none', border: 'none', background: '#1E3224',
                    color: '#fff', borderRadius: 8, padding: '6px 14px',
                    fontSize: 12, fontWeight: 900, cursor: 'pointer',
                    opacity: (!assignSprintId || selectedTaskIds.size === 0) ? 0.5 : 1,
                  }}
                >
                  {assigning ? 'Assigning…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={cancelAssignMode}
                  style={{
                    appearance: 'none', border: '1px solid rgba(30,50,36,0.20)',
                    background: '#fff', color: 'rgba(30,50,36,0.7)', borderRadius: 8,
                    padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              isManager && (
                <button
                  type="button"
                  onClick={() => { setAssignMode(true); setSelectedTaskIds(new Set()); }}
                  style={{
                    appearance: 'none', border: '1.5px solid rgba(30,50,36,0.22)',
                    background: '#fff', color: '#1E3224', borderRadius: 10,
                    padding: '6px 14px', fontSize: 12, fontWeight: 900,
                    letterSpacing: '0.3px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 6,
                  }}
                >
                  <IoMdAddCircle size={16} /> Assign to Sprint
                </button>
              )
            )}
            {isManager && !assignMode && (
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  appearance: 'none', border: 'none', background: '#C74634',
                  color: '#fff', borderRadius: 10, padding: '7px 16px',
                  fontSize: 12, fontWeight: 900, letterSpacing: '0.5px', cursor: 'pointer',
                }}
              >
                + Create Task
              </button>
            )}
          </div>
        </div>
        <div className="VantageCardBody">
          {backlogLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(30,50,36,0.45)', fontSize: 13 }}>Loading tasks…</div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(30,50,36,0.45)', fontSize: 13 }}>
              No tasks {showAllSprints ? 'yet' : 'for this sprint'}.{isManager ? ' Click "+ Create Task" to add one.' : ''}
            </div>
          ) : (
            <table className="VantageTable">
              <thead>
                <tr>
                  {assignMode && (
                    <th style={{ width: 36, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', accentColor: '#C74634' }}
                      />
                    </th>
                  )}
                  <th style={{ width: showAllSprints ? '30%' : '36%' }}>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  {showAllSprints && <th>Sprint #</th>}
                  <th>Assignee</th>
                  <th style={{ textAlign: 'right' }}>Points</th>
                  {!assignMode && isManager && <th style={{ textAlign: 'right' }}></th>}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const sc = STATUS_COLORS[task.status] || STATUS_COLORS['TODO'];
                  return (
                    <tr
                      key={task.taskId}
                      style={{
                        transition: 'background 120ms',
                        background: assignMode && selectedTaskIds.has(task.taskId) ? 'rgba(199,70,52,0.06)' : 'transparent',
                        cursor: assignMode ? 'pointer' : 'default',
                      }}
                      onClick={assignMode ? () => toggleSelectTask(task.taskId) : undefined}
                      onMouseEnter={e => { if (!assignMode) e.currentTarget.style.background = 'rgba(194,212,212,0.18)'; }}
                      onMouseLeave={e => { if (!assignMode) e.currentTarget.style.background = assignMode && selectedTaskIds.has(task.taskId) ? 'rgba(199,70,52,0.06)' : 'transparent'; }}
                    >
                      {assignMode && (
                        <td style={{ textAlign: 'center', width: 36 }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.has(task.taskId)}
                            onChange={() => toggleSelectTask(task.taskId)}
                            style={{ cursor: 'pointer', accentColor: '#C74634' }}
                          />
                        </td>
                      )}
                      <td>
                        <div style={{ fontWeight: 700 }}>{task.taskName}</div>
                        {task.description && (
                          <div style={{ fontSize: 12, color: 'rgba(30,50,36,0.55)', marginTop: 2 }}>
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {!isManager ? (
                          <select
                            className="VantageInlineSelect"
                            value={task.category || 'FEATURE'}
                            onChange={async e => {
                              const newCat = e.target.value;
                              await fetch(`/tasks/${task.taskId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  taskName: task.taskName, description: task.description,
                                  status: task.status, category: newCat,
                                  storyPoints: task.storyPoints, dueDate: task.dueDate,
                                  sprintId: task.sprintId,
                                }),
                              });
                              setBacklogTasks(prev => prev.map(t =>
                                t.taskId === task.taskId ? { ...t, category: newCat } : t
                              ));
                            }}
                          >
                            <option value="FEATURE">FEATURE</option>
                            <option value="BUG">BUG</option>
                            <option value="ISSUE">ISSUE</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', color: 'rgba(30,50,36,0.65)' }}>
                            {task.category || '—'}
                          </span>
                        )}
                      </td>
                      <td>
                        {!isManager ? (
                          <select
                            className={'VantageStatusSelect VantageStatus--' + (task.status || 'TODO')}
                            value={task.status || 'TODO'}
                            onChange={async e => {
                              const newStatus = e.target.value;
                              await fetch(`/tasks/${task.taskId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  taskName: task.taskName, description: task.description,
                                  status: newStatus, category: task.category,
                                  storyPoints: task.storyPoints, dueDate: task.dueDate,
                                  sprintId: task.sprintId,
                                }),
                              });
                              setBacklogTasks(prev => prev.map(t =>
                                t.taskId === task.taskId ? { ...t, status: newStatus } : t
                              ));
                            }}
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                            <option value="BLOCKED">BLOCKED</option>
                          </select>
                        ) : (
                          <span style={{ ...sc, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 900, letterSpacing: '0.4px' }}>
                            {task.status}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'rgba(30,50,36,0.65)' }}>
                        {task.dueDate
                          ? (() => { const [y,m,d] = String(task.dueDate).split(/[-T]/); return new Date(+y,+m-1,+d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); })()
                          : '—'}
                      </td>
                      {showAllSprints && (
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 800,
                            color: task.sprintId ? '#1E3224' : 'rgba(30,50,36,0.38)',
                            fontStyle: task.sprintId ? 'normal' : 'italic',
                          }}>
                            {getSprintName(task.sprintId)}
                          </span>
                        </td>
                      )}
                      <td>
                        {(() => {
                          const name = getAssigneeName(task.taskId);
                          return name ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 700, color: '#1E3224',
                            }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: '#C74634', color: '#fff',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 900, flexShrink: 0,
                              }}>
                                {name[0].toUpperCase()}
                              </span>
                              {name}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'rgba(30,50,36,0.35)', fontStyle: 'italic' }}>
                              Unassigned
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {task.storyPoints != null ? task.storyPoints : '—'}
                      </td>
                      {!assignMode && isManager && (
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => setEditingTask(task)}
                              title="Edit task"
                              style={{
                                appearance: 'none', border: '1px solid rgba(30,50,36,0.16)',
                                background: '#fff', borderRadius: 8, padding: '5px 7px',
                                cursor: 'pointer', color: '#1E3224',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 120ms',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(194,212,212,0.35)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => setEditingTask({ ...task, _confirmDelete: true })}
                              title="Delete task"
                              style={{
                                appearance: 'none', border: '1px solid rgba(199,70,52,0.25)',
                                background: '#fff', borderRadius: 8, padding: '5px 7px',
                                cursor: 'pointer', color: '#C74634',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 120ms',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(199,70,52,0.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                            >
                              <BsTrash3 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isManager && (
        <button
          type="button"
          className="SM-create-sprint-btn"
          onClick={() => setIsCreateSprintOpen(true)}
        >
          <span className="SM-create-sprint-icon">+</span>
          CREATE NEW SPRINT
        </button>
      )}
    </div>
  );
}

export default BacklogMainTab;