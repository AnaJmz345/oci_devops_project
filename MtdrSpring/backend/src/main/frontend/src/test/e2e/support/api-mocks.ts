import type { Page, Route } from '@playwright/test';
import {
  API_ENDPOINTS,
  BUGS,
  SPRINTS,
  TASK_ASSIGNEES,
  TASKS,
  type TestTask,
  type TestUser,
  USERS,
} from './test-data';

export interface MockApiOptions {
  currentUser?: TestUser | null;
  tasks?: TestTask[];
  useHar?: boolean;
}

type JsonBody = Record<string, unknown> | Array<unknown> | null;

async function fulfillJson(route: Route, body: JsonBody, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function cloneTasks(tasks: TestTask[]) {
  return tasks.map((task) => ({ ...task }));
}

export async function mockVantageApi(page: Page, options: MockApiOptions = {}) {
  const currentUser = options.currentUser ?? USERS.manager;
  const tasks = cloneTasks(options.tasks ?? TASKS);
  const createdTasks: TestTask[] = [];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (!isMockedApiPath(path)) {
      await route.continue();
      return;
    }

    if (path === API_ENDPOINTS.currentUser && method === 'GET') {
      if (!currentUser) {
        await fulfillJson(route, { message: 'Unauthenticated' }, 401);
        return;
      }
      await fulfillJson(route, currentUser);
      return;
    }

    if (path === API_ENDPOINTS.login && method === 'POST') {
      const payload = request.postDataJSON() as { mail?: string; password?: string };
      if (payload.mail === USERS.manager.mail && payload.password === 'wrong-password') {
        await fulfillJson(route, { message: 'Invalid credentials' }, 401);
        return;
      }
      await fulfillJson(route, USERS.manager);
      return;
    }

    if (path === API_ENDPOINTS.logout && method === 'POST') {
      await fulfillJson(route, { ok: true });
      return;
    }

    if (path === API_ENDPOINTS.users && method === 'GET') {
      await fulfillJson(route, [USERS.manager, USERS.developer, USERS.developerTwo]);
      return;
    }

    if (path === API_ENDPOINTS.developers && method === 'GET') {
      await fulfillJson(route, [USERS.developer, USERS.developerTwo]);
      return;
    }

    if (path === API_ENDPOINTS.sprints && method === 'GET') {
      await fulfillJson(route, SPRINTS);
      return;
    }

    if (path === API_ENDPOINTS.bugs && method === 'GET') {
      await fulfillJson(route, BUGS);
      return;
    }

    if (path === API_ENDPOINTS.allTaskAssignees && method === 'GET') {
      await fulfillJson(route, TASK_ASSIGNEES);
      return;
    }

    if (path === API_ENDPOINTS.taskAssignees && method === 'POST') {
      await fulfillJson(route, request.postDataJSON() as JsonBody, 201);
      return;
    }

    const taskAssigneeMatch = path.match(/^\/tasks\/(\d+)\/assignees$/);
    if (taskAssigneeMatch && method === 'GET') {
      const taskId = Number(taskAssigneeMatch[1]);
      await fulfillJson(route, TASK_ASSIGNEES.filter((item) => item.taskId === taskId));
      return;
    }

    const taskCompleteMatch = path.match(/^\/tasks\/(\d+)\/complete$/);
    if (taskCompleteMatch && method === 'POST') {
      const taskId = Number(taskCompleteMatch[1]);
      const task = tasks.find((item) => item.taskId === taskId);
      const updated = { ...(task ?? TASKS[0]), status: 'DONE' as const };
      replaceTask(tasks, updated);
      await fulfillJson(route, updated);
      return;
    }

    const taskMatch = path.match(/^\/tasks\/(\d+)$/);
    if (taskMatch && method === 'PUT') {
      const taskId = Number(taskMatch[1]);
      const payload = request.postDataJSON() as Partial<TestTask>;
      const previous = tasks.find((item) => item.taskId === taskId);
      const updated = {
        ...(previous ?? TASKS[0]),
        ...payload,
        taskId,
      } as TestTask;
      replaceTask(tasks, updated);
      await fulfillJson(route, updated);
      return;
    }

    if (taskMatch && method === 'DELETE') {
      const taskId = Number(taskMatch[1]);
      const index = tasks.findIndex((item) => item.taskId === taskId);
      if (index >= 0) tasks.splice(index, 1);
      await fulfillJson(route, { ok: true });
      return;
    }

    if (path === API_ENDPOINTS.tasks && method === 'GET') {
      await fulfillJson(route, [...tasks, ...createdTasks]);
      return;
    }

    if (path === API_ENDPOINTS.tasks && method === 'POST') {
      const payload = request.postDataJSON() as Partial<TestTask>;
      const created = {
        taskId: 900 + createdTasks.length + 1,
        taskName: payload.taskName ?? 'Untitled task',
        description: payload.description ?? '',
        status: payload.status ?? 'TODO',
        category: payload.category ?? 'FEATURE',
        storyPoints: payload.storyPoints ?? 1,
        dueDate: payload.dueDate ?? '2026-06-30',
        sprintId: payload.sprintId ?? null,
        createdBy: payload.createdBy ?? USERS.manager.oracleId,
      } as TestTask;
      createdTasks.push(created);
      await fulfillJson(route, created, 201);
      return;
    }

    await fulfillJson(route, { message: `Unhandled mocked route: ${method} ${path}` }, 500);
  });

  if (options.useHar) {
    await page.routeFromHAR('src/test/e2e/har/vantage-api.har', {
      notFound: 'fallback',
      update: false,
    });
  }
}

function replaceTask(tasks: TestTask[], updated: TestTask) {
  const index = tasks.findIndex((item) => item.taskId === updated.taskId);
  if (index >= 0) {
    tasks[index] = updated;
  } else {
    tasks.push(updated);
  }
}

function isMockedApiPath(path: string) {
  return (
    path.startsWith('/users') ||
    path.startsWith('/tasks') ||
    path.startsWith('/sprints') ||
    path.startsWith('/bugs') ||
    path === '/logout'
  );
}
