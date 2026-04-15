import API_LIST from '../API';

function normalizeTask(raw) {
  const id = raw?.id ?? raw?.ID ?? raw?.taskId ?? raw?.TASK_ID;
  const title = raw?.description ?? raw?.taskName ?? raw?.TASK_NAME ?? '';
  const description = raw?.name ?? raw?.details ?? raw?.DESCRIPTION ?? '';
  const storyPoints = raw?.storyPoints ?? raw?.STORY_POINTS ?? null;
  const status = raw?.done ?? raw?.status ?? raw?.STATUS ?? 'TODO';

  return {
    id: typeof id === 'string' ? parseInt(id, 10) : id,
    title,
    description,
    storyPoints,
    status,
    raw,
  };
}

async function requestJson(url, options) {
  const resp = await fetch(url, options);
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(text || `Request failed (${resp.status})`);
  }
  // Some endpoints return empty body (e.g., create).
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return resp.json();
  return null;
}

export async function getTasks() {
  const data = await requestJson(API_LIST, { method: 'GET' });
  return Array.isArray(data) ? data.map(normalizeTask) : [];
}

export async function createTask({ title, description, storyPoints }) {
  const payload = {
    description: title,
    name: description,
    storyPoints: storyPoints === '' ? null : storyPoints,
    done: 'TODO',
  };

  const resp = await fetch(API_LIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(text || `Create failed (${resp.status})`);
  }

  const location = resp.headers.get('location');
  const id = location ? parseInt(location, 10) : undefined;
  return { id };
}

export async function updateTask(taskId, { title, description, storyPoints, status }) {
  // Spring endpoint updates by replacing fields; send the full payload to avoid clearing columns.
  const payload = {
    description: title,
    name: description,
    storyPoints: storyPoints === '' ? null : storyPoints,
    done: status,
  };

  await requestJson(`${API_LIST}/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(taskId) {
  await requestJson(`${API_LIST}/${taskId}`, { method: 'DELETE' });
}
