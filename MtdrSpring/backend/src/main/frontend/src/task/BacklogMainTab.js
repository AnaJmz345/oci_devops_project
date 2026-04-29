import React from 'react';
import { IoMdAddCircle } from 'react-icons/io';
import { FaChevronDown, FaEdit } from 'react-icons/fa';
import { BsTrash3 } from 'react-icons/bs';
import { FaBug } from 'react-icons/fa';
import LogActualHoursModal from './LogActualHoursModal';

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
  taskBugCounts,
  onReportBug,
  onViewBugs,
}) {
  const [pendingCompletion, setPendingCompletion] = React.useState(null);
  const [completionError, setCompletionError] = React.useState('');
  const [completing, setCompleting] = React.useState(false);
  const [assigneeFilter, setAssigneeFilter] = React.useState('');
  const [assigneeMenuOpen, setAssigneeMenuOpen] = React.useState(false);
  const assigneeMenuRef = React.useRef(null);

  const STATUS_COLORS = {
    TODO: { background: 'rgba(30,50,36,0.08)', color: '#1E3224' },
    IN_PROGRESS: { background: 'rgba(241,177,63,0.18)', color: '#9a6c00' },
    DONE: { background: 'rgba(76,130,92,0.18)', color: '#2d6b3f' },
    BLOCKED: { background: 'rgba(199,70,52,0.15)', color: '#C74634' },
  };

  const showAllSprints = activeSprintId === 'all';

  const sprintFilteredTasks = showAllSprints
    ? backlogTasks
    : backlogTasks.filter(t => String(t.sprintId) === String(activeSprintId));

  const visibleTasks = sprintFilteredTasks.filter(task => {
    if (assigneeFilter === '') return true;
    const assignee = taskAssignees?.[task.taskId];
    const assigneeOracleId = assignee?.oracleId ?? assignee?.oracle_id;
    if (assigneeFilter === 'unassigned') return !assigneeOracleId;
    return String(assigneeOracleId) === String(assigneeFilter);
  });

  const getSprintName = (sprintId) => {
    if (!sprintId) return 'Not assigned';
    const found = (sprints || []).find(s => String(s.sprintId) === String(sprintId));
    return found ? found.sprintName : `Sprint #${sprintId}`;
  };

  const getAssigneeName = (taskId) => {
    const assignee = taskAssignees?.[taskId];
    if (!assignee) return null;
    const assigneeOracleId = assignee.oracleId ?? assignee.oracle_id;
    const u = (users || []).find(user =>
      String(user.oracleId ?? user.oracle_id) === String(assigneeOracleId)
    );
    return u ? u.name.split(' ')[0] : null;
  };

  const assigneeOptions = (users || [])
    .map(u => {
      const oracleId = u.oracleId ?? u.oracle_id;
      if (oracleId == null) return null;
      const name = u.name || '';
      const mail = u.mail || '';
      const label = mail ? `${name} (${mail})` : name;
      if (!label) return null;
      return { oracleId: String(oracleId), label };
    })
    .filter(Boolean)
    .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  const assigneeMenuItems = [
    { value: '', label: 'All assignees' },
    { value: 'unassigned', label: 'Unassigned', divider: true },
    ...assigneeOptions.map(opt => ({ value: opt.oracleId, label: opt.label })),
  ];

  React.useEffect(() => {
    if (!assigneeMenuOpen) return;

    const handleClick = (event) => {
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target)) {
        setAssigneeMenuOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === 'Escape') setAssigneeMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [assigneeMenuOpen]);

  const applyAssigneeFilter = (next) => {
    if (assignMode) setSelectedTaskIds(new Set());
    setAssigneeFilter(next);
    setAssigneeMenuOpen(false);
  };

  const requestDoneTransition = (task) => {
    const assignee = taskAssignees?.[task.taskId];

    if (!assignee?.oracleId && !assignee?.oracle_id) {
      setCompletionError('Assign a developer to this task before marking it as DONE.');
      setPendingCompletion({
        task,
        assignee: null,
        assigneeName: null,
        initialHours: '',
      });
      return;
    }

    setCompletionError('');
    setPendingCompletion({
      task,
      assignee,
      assigneeName: getAssigneeName(task.taskId),
      initialHours: assignee.realTimeSpent ?? '',
    });
  };

  const handleCompletionConfirm = async (realTimeSpent) => {
    const assigneeOracleId = pendingCompletion?.assignee?.oracleId ?? pendingCompletion?.assignee?.oracle_id;

    if (!pendingCompletion?.task?.taskId || !assigneeOracleId) {
      setCompletionError('Assign a developer to this task before marking it as DONE.');
      return;
    }

    const { task, assignee } = pendingCompletion;
    setCompleting(true);
    setCompletionError('');

    try {
      const res = await fetch(`/tasks/${task.taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oracleId: assigneeOracleId,
          realTimeSpent,
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Failed to complete task.');
      }

      const updatedTask = await res.json();

      setBacklogTasks(prev => prev.map(item =>
        item.taskId === updatedTask.taskId ? updatedTask : item
      ));

      setTaskAssignees(prev => ({
        ...prev,
        [task.taskId]: {
          ...assignee,
          realTimeSpent,
        },
      }));

      setPendingCompletion(null);
    } catch (err) {
      setCompletionError(err.message || 'Could not save actual hours.');
    } finally {
      setCompleting(false);
    }
  };

  const toggleSelectTask = (taskId) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === visibleTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(visibleTasks.map(t => t.taskId)));
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
            taskName: task.taskName,
            description: task.description,
            status: task.status,
            category: task.category,
            storyPoints: task.storyPoints,
            dueDate: task.dueDate,
            sprintId: Number(assignSprintId),
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

  const allSelected = visibleTasks.length > 0 && selectedTaskIds.size === visibleTasks.length;

  const tableColumnCount =
    (assignMode ? 1 : 0) +
    1 +
    1 +
    1 +
    1 +
    (showAllSprints ? 1 : 0) +
    1 +
    1 +
    1 +
    (!assignMode && isManager ? 1 : 0);

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
            {visibleTasks.length > 0 && (
              <span style={{ fontWeight: 500, color: 'rgba(30,50,36,0.5)', fontSize: 13 }}>
                {' '}({visibleTasks.length})
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
                    height: 32,
                    border: '1.5px solid rgba(30,50,36,0.20)',
                    borderRadius: 8,
                    padding: '0 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#1E3224',
                    background: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="">— Select sprint —</option>
                  {(sprints || []).map(s => (
                    <option key={s.sprintId} value={s.sprintId}>{s.sprintName}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssignSprint}
                  disabled={assigning || !assignSprintId || selectedTaskIds.size === 0}
                  style={{
                    appearance: 'none',
                    border: 'none',
                    background: '#1E3224',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    opacity: (!assignSprintId || selectedTaskIds.size === 0) ? 0.5 : 1,
                  }}
                >
                  {assigning ? 'Assigning…' : 'Confirm'}
                </button>

                <button
                  type="button"
                  onClick={cancelAssignMode}
                  style={{
                    appearance: 'none',
                    border: '1px solid rgba(30,50,36,0.20)',
                    background: '#fff',
                    color: 'rgba(30,50,36,0.7)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              isManager && (
                <button
                  type="button"
                  onClick={() => {
                    setAssignMode(true);
                    setSelectedTaskIds(new Set());
                  }}
                  style={{
                    appearance: 'none',
                    border: '1.5px solid rgba(30,50,36,0.22)',
                    background: '#fff',
                    color: '#1E3224',
                    borderRadius: 10,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: '0.3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  appearance: 'none',
                  border: 'none',
                  background: '#C74634',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                }}
              >
                + Create Task
              </button>
            )}
          </div>
        </div>

        <div className="VantageCardBody">
          {backlogLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(30,50,36,0.45)', fontSize: 13 }}>
              Loading tasks…
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

                  <th style={{ minWidth: 130 }}>
                    <div ref={assigneeMenuRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={assigneeMenuOpen}
                        aria-controls="assignee-filter-menu"
                        onClick={() => setAssigneeMenuOpen(open => !open)}
                        style={{
                          appearance: 'none',
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 700,
                          color: '#1E3224',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Assignee</span>
                        <FaChevronDown
                          size={11}
                          style={{
                            marginTop: 1,
                            transition: 'transform 120ms',
                            transform: assigneeMenuOpen ? 'rotate(180deg)' : 'none',
                          }}
                        />
                      </button>

                      {assigneeMenuOpen && (
                        <div
                          id="assignee-filter-menu"
                          role="listbox"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            minWidth: 220,
                            maxWidth: 280,
                            maxHeight: 240,
                            overflowY: 'auto',
                            background: '#fff',
                            border: '1px solid rgba(30,50,36,0.12)',
                            borderRadius: 10,
                            padding: 6,
                            boxShadow: '0 10px 24px rgba(30,50,36,0.15)',
                            zIndex: 20,
                          }}
                        >
                          {assigneeMenuItems.map(item => {
                            const isSelected = String(assigneeFilter) === String(item.value);

                            return (
                              <React.Fragment key={item.value === '' ? 'all' : item.value}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => applyAssigneeFilter(item.value)}
                                  onMouseEnter={e => {
                                    if (!isSelected) e.currentTarget.style.background = 'rgba(194,212,212,0.35)';
                                  }}
                                  onMouseLeave={e => {
                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                  }}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    background: isSelected ? 'rgba(199,70,52,0.12)' : 'transparent',
                                    color: isSelected ? '#C74634' : '#1E3224',
                                    padding: '6px 8px',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: isSelected ? 700 : 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {item.label}
                                </button>

                                {item.divider && (
                                  <div style={{ height: 1, background: 'rgba(30,50,36,0.08)', margin: '4px 6px' }} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </th>

                  <th style={{ textAlign: 'right' }}>Points</th>
                  <th style={{ textAlign: 'center' }}>Defects</th>
                  {!assignMode && isManager && <th style={{ textAlign: 'right' }}></th>}
                </tr>
              </thead>

              <tbody>
                {visibleTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableColumnCount}
                      style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(30,50,36,0.45)', fontSize: 13 }}
                    >
                      {assigneeFilter !== ''
                        ? 'No tasks for this assignee.'
                        : `No tasks ${showAllSprints ? 'yet' : 'for this sprint'}.${isManager ? ' Click "+ Create Task" to add one.' : ''}`}
                    </td>
                  </tr>
                ) : (
                  visibleTasks.map(task => {
                    const sc = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;

                    return (
                      <tr
                        key={task.taskId}
                        style={{
                          transition: 'background 120ms',
                          background: assignMode && selectedTaskIds.has(task.taskId) ? 'rgba(199,70,52,0.06)' : 'transparent',
                          cursor: assignMode ? 'pointer' : 'default',
                        }}
                        onClick={assignMode ? () => toggleSelectTask(task.taskId) : undefined}
                        onMouseEnter={e => {
                          if (!assignMode) e.currentTarget.style.background = 'rgba(194,212,212,0.18)';
                        }}
                        onMouseLeave={e => {
                          if (!assignMode) {
                            e.currentTarget.style.background = assignMode && selectedTaskIds.has(task.taskId)
                              ? 'rgba(199,70,52,0.06)'
                              : 'transparent';
                          }
                        }}
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
                                    taskName: task.taskName,
                                    description: task.description,
                                    status: task.status,
                                    category: newCat,
                                    storyPoints: task.storyPoints,
                                    dueDate: task.dueDate,
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

                                if (newStatus === 'DONE' && task.status !== 'DONE') {
                                  requestDoneTransition(task);
                                  return;
                                }

                                await fetch(`/tasks/${task.taskId}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    taskName: task.taskName,
                                    description: task.description,
                                    status: newStatus,
                                    category: task.category,
                                    storyPoints: task.storyPoints,
                                    dueDate: task.dueDate,
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
                            ? (() => {
                                const [y, m, d] = String(task.dueDate).split(/[-T]/);
                                return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                });
                              })()
                            : '—'}
                        </td>

                        {showAllSprints && (
                          <td>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
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
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#1E3224',
                              }}>
                                <span style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: '#C74634',
                                  color: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  fontWeight: 900,
                                  flexShrink: 0,
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

                        <td style={{ textAlign: 'center' }}>
                          {(() => {
                            const bugCount = (taskBugCounts && taskBugCounts[task.taskId]) || 0;

                            return (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {bugCount > 0 && (
                                  <span
                                    onClick={() => onViewBugs && onViewBugs(task)}
                                    title="View bugs for this task"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      background: 'rgba(199,70,52,0.12)',
                                      color: '#C74634',
                                      borderRadius: 6,
                                      padding: '2px 8px',
                                      fontSize: 11,
                                      fontWeight: 900,
                                      cursor: 'pointer',
                                      transition: 'background 120ms',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(199,70,52,0.22)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(199,70,52,0.12)'; }}
                                  >
                                    <FaBug size={10} /> {bugCount}
                                  </span>
                                )}

                                {!isManager && task.status === 'DONE' && (
                                  <button
                                    onClick={() => onReportBug && onReportBug(task)}
                                    title="Report a bug on this task"
                                    style={{
                                      appearance: 'none',
                                      border: '1px solid rgba(199,70,52,0.25)',
                                      background: '#fff',
                                      borderRadius: 8,
                                      padding: '4px 8px',
                                      cursor: 'pointer',
                                      color: '#C74634',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 10,
                                      fontWeight: 800,
                                      transition: 'background 120ms',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(199,70,52,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                                  >
                                    <FaBug size={10} /> Report
                                  </button>
                                )}

                                {bugCount === 0 && (isManager || task.status !== 'DONE') && (
                                  <span style={{ fontSize: 11, color: 'rgba(30,50,36,0.30)' }}>—</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {!assignMode && isManager && (
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              <button
                                onClick={() => setEditingTask(task)}
                                title="Edit task"
                                style={{
                                  appearance: 'none',
                                  border: '1px solid rgba(30,50,36,0.16)',
                                  background: '#fff',
                                  borderRadius: 8,
                                  padding: '5px 7px',
                                  cursor: 'pointer',
                                  color: '#1E3224',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
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
                                  appearance: 'none',
                                  border: '1px solid rgba(199,70,52,0.25)',
                                  background: '#fff',
                                  borderRadius: 8,
                                  padding: '5px 7px',
                                  cursor: 'pointer',
                                  color: '#C74634',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
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
                  })
                )}
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

      <LogActualHoursModal
        open={pendingCompletion !== null}
        taskName={pendingCompletion?.task?.taskName}
        assigneeName={pendingCompletion?.assigneeName}
        initialHours={pendingCompletion?.initialHours}
        loading={completing}
        error={completionError}
        onCancel={() => {
          if (completing) return;
          setPendingCompletion(null);
          setCompletionError('');
        }}
        onConfirm={handleCompletionConfirm}
      />
    </div>
  );
}

export default BacklogMainTab;


