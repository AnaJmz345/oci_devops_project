import { test, expect, type Page } from '@playwright/test';

// This is for blocking the service workers so they do not interfere with the mocked requests.
// It helps the HAR and route mocks control the API responses during the test.
test.use({
  serviceWorkers: 'block',
});

// Mock user for the manager role.
// This lets the test simulate a logged-in manager without using the real OCI login.
const managerUser = {
  oracle_id: 6,
  oracleId: 6,
  name: 'Marisa',
  mail: 'a01709619@tec.mx',
  role: 'MANAGER',
};

// Tasks used by the tests which help  parameterize the create task flow.
const recordedTasks = [
  {
    id: 196,
    name: 'Create tsk 1',
    description: 'Create task 1 for testing playwright',
    status: 'IN_PROGRESS',
    category: 'FEATURE',
    assignee: '1',
    sprint: '5',
    estimatedHours: '1',
    dueDate: '2026-06-12',
  },
  {
    id: 197,
    name: 'Create task 2',
    description: 'Create task 2 for playwright',
    status: 'TODO',
    category: 'FEATURE',
    assignee: '3',
    sprint: '5',
    estimatedHours: '2',
    dueDate: '2026-06-12',
  },
  {
    id: 198,
    name: 'Create task 3',
    description: 'Crete task 3 for playwright',
    status: 'TODO',
    category: 'FEATURE',
    assignee: '4',
    sprint: '5',
    estimatedHours: '1',
    dueDate: '2026-06-11',
  },
];

// Mock developers used by the backlog form.
// The app needs these users to fill the assignee dropdown.
const developers = [
  { oracleId: 3, oracle_id: 3, name: 'Cesar', mail: 'a01645209@tec.mx', role: 'DEVELOPER' },
  { oracleId: 4, oracle_id: 4, name: 'Luisa', mail: 'a01067715@tec.mx', role: 'DEVELOPER' },
  { oracleId: 7, oracle_id: 7, name: 'Demmi', mail: 'a01709620@tec.mx', role: 'DEVELOPER' },
  { oracleId: 2, oracle_id: 2, name: 'Ana', mail: 'a01644532@tec.mx', role: 'DEVELOPER' },
  { oracleId: 1, oracle_id: 1, name: 'Ariana', mail: 'a01644770@tec.mx', role: 'DEVELOPER' },
  { oracleId: 16, oracle_id: 16, name: 'Pedro', mail: 'pedro@gmail.com', role: 'DEVELOPER' },
];


// Mock sprints used by the backlog form.
// The app needs these sprints to fill the sprint dropdown.
const sprints = [
  { sprintId: 3, sprintName: 'Sprint 3', goal: 'Recorded sprint 3' },
  { sprintId: 0, sprintName: 'Sprint 0', goal: 'Recorded sprint 0' },
  { sprintId: 5, sprintName: 'Sprint 4', goal: 'Recorded sprint 4' },
  { sprintId: 1, sprintName: 'Sprint 1', goal: 'Recorded sprint 1' },
  { sprintId: 2, sprintName: 'Sprint 2', goal: 'Recorded sprint 2' },
];

// This function prepares the fake backend for the test.
//The HAR contains previously recorded traffic. In this suite, we load it to demonstrate Mock with HAR Files. We also add manual mocks for dynamic routes like creating, updating, and deleting tasks, because those responses change during the test.

async function useRecordedHarAndManagerSession(page: Page) {

   // These arrays are to store the created tasks during the test temporarily, when the UI creates, edits, or deletes tasks, these arrays are updated.
  const tasks: Array<Record<string, unknown>> = [];
  const taskAssignees: Array<Record<string, unknown>> = [];

  // This uses the HAR file recorded before.
  // notFound: 'fallback' means that if the HAR does not have a matching request,
  // Playwright can continue to the next route handler instead of failing directly.
  await page.routeFromHAR('src/test/e2e/hars/manager-backlog.har', {
    notFound: 'fallback',
  });

  // This route catches API requests and returns fake responses.
  // This is used so the test never depends on the real backend or database.
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const fulfillJson = async (body: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };

     // Mocks the current logged-in user.
    if (path === '/users/me' && method === 'GET') {
      await fulfillJson(managerUser);
      return;
    }

    // This mocks the users list.
    if (path === '/users' && method === 'GET') {
      await fulfillJson([managerUser, ...developers]);
      return;
    }

      // This mocks the developers list for the assignee dropdown.
    if (path === '/users/developers' && method === 'GET') {
      await fulfillJson(developers);
      return;
    }

    // mocks the sprints list for the sprint dropdown.
    if (path === '/sprints' && method === 'GET') {
      await fulfillJson(sprints);
      return;
    }

    //mocks bugs as an empty list because this suite focuses on tasks.
    if (path === '/bugs' && method === 'GET') {
      await fulfillJson([]);
      return;
    }

    // returns the current tasks created during the test.
    if (path === '/tasks' && method === 'GET') {
      await fulfillJson(tasks);
      return;
    }

    // This handles creating a task from the UI.
    // It reads what the frontend sends and then stores the new task in the tasks array, so it can be retrieved later when the UI calls GET /tasks again.
    if (path === '/tasks' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      const recordedTask = recordedTasks.find((task) => task.name === body.taskName);
      const createdTask = {
        taskId: recordedTask?.id ?? Number(Date.now()),
        taskName: body.taskName,
        description: body.description,
        status: body.status,
        category: body.category,
        storyPoints: body.storyPoints,
        dueDate: body.dueDate,
        sprintId: body.sprintId,
        createdBy: body.createdBy,
      };
      tasks.push(createdTask);
      await fulfillJson(createdTask, 201);
      return;
    }

    // This returns all task assignees created during the test.
    if (path === '/tasks/assignees/all' && method === 'GET') {
      await fulfillJson(taskAssignees);
      return;
    }

    // This handles assigning a user to a task.
    if (path === '/tasks/assignees' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      const assignee = {
        taskId: body.taskId,
        oracleId: body.oracleId,
        oracle_id: body.oracleId,
        estimatedCompletionTime: body.estimatedCompletionTime,
        realTimeSpent: body.realTimeSpent ?? 0,
        additionalComments: body.additionalComments ?? null,
      };
      taskAssignees.push(assignee);
      await fulfillJson(assignee, 201);
      return;
    }

     // This handles getting assignees for one specific task.
    const taskAssigneesMatch = path.match(/^\/tasks\/(\d+)\/assignees$/);
    if (taskAssigneesMatch && method === 'GET') {
      const taskId = Number(taskAssigneesMatch[1]);
      await fulfillJson(taskAssignees.filter((item) => Number(item.taskId) === taskId));
      return;
    }

    // This handles updating one task.
    const taskMatch = path.match(/^\/tasks\/(\d+)$/);
    if (taskMatch && method === 'PUT') {
      const taskId = Number(taskMatch[1]);
      const body = request.postDataJSON() as Record<string, unknown>;
      const index = tasks.findIndex((task) => Number(task.taskId) === taskId);
      const updatedTask = {
        ...(tasks[index] ?? {}),
        ...body,
        taskId,
      };
      if (index >= 0) {
        tasks[index] = updatedTask;
      }
      await fulfillJson(updatedTask);
      return;
    }

    // This handles deleting one task.
    if (taskMatch && method === 'DELETE') {
      const taskId = Number(taskMatch[1]);
      const index = tasks.findIndex((task) => Number(task.taskId) === taskId);
      if (index >= 0) {
        tasks.splice(index, 1);
      }
      await fulfillJson({ ok: true });
      return;
    }

    // If the request was not handled above, Playwright lets the HAR or browser handle it.
    await route.fallback();
  });
}

async function openBacklog(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('vantage-shell')).toBeVisible();
  await page.getByTestId('sidebar-link-backlog').click();
  await expect(page.getByTestId('backlog-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Backlog' })).toBeVisible();
}

// Creates one task using the same steps a user would do in the UI.
// It uses labels and test ids
async function createRecordedTask(page: Page, task: typeof recordedTasks[number]) {
  await page.getByTestId('create-task-button').click();
  await expect(page.getByTestId('create-task-modal')).toBeVisible();

  await page.getByLabel('Task Name').fill(task.name);
  await page.getByLabel('Description').fill(task.description);
  await page.getByLabel('Assignee', { exact: true }).selectOption(task.assignee);
  await page.getByLabel('Status').selectOption(task.status);
  await page.getByLabel('Category').selectOption(task.category);
  await page.getByLabel('Sprint', { exact: true }).selectOption(task.sprint);
  await page.getByLabel('Estimated Completion Time').fill(task.estimatedHours);
  await page.getByLabel('Due Date').fill(task.dueDate);
  await page.getByTestId('submit-create-task-button').click();

  await expect(page.getByTestId('create-task-modal')).not.toBeVisible();
  await expect(page.getByTestId(`task-row-${task.id}`)).toContainText(task.name);
}

// This suite tests the Manager Backlog flow.
test.describe('Manager backlog suite with HAR @manager @backlog @har', () => {
  test.beforeAll(async () => {
    console.log('Starting manager backlog HAR suite');
  });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({
      time: new Date('2026-06-12T09:00:00'),
    });

    await useRecordedHarAndManagerSession(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await page.screenshot({
      path: testInfo.outputPath('manager-backlog-screenshot.png'),
      fullPage: true,
    });
  });

  test.afterAll(async () => {
    console.log('Finished manager backlog HAR suite');
  });

   // This test simulates the manager creating three complete tasks from the Backlog page.
  // The flow is: open Backlog, click create task, fill the form, submit it,
  // and verify that each task appears in the backlog table.
  // It uses parameterization because the same create flow is repeated for each task in recordedTasks.
  // It also uses HAR/mock API responses, auto-waiting actions, soft assertions, and a visual snapshot.
  test('manager creates three tasks and sees them in backlog @create @parameterized', async ({ page }) => {
    test.slow();
    expect(recordedTasks).toHaveLength(3);

    await openBacklog(page);

    for (const task of recordedTasks) {
      await createRecordedTask(page, task);
      // Soft assertion so the test can continue checking the other tasks.
      await expect.soft(page.getByText(task.description)).toBeVisible();
    }

    // These assertions check that the created tasks are visible in the table.
    await expect(page.getByTestId('backlog-table')).toContainText('Create tsk 1');
    await expect(page.getByTestId('backlog-table')).toContainText('Create task 2');
    await expect(page.getByTestId('backlog-table')).toContainText('Create task 3');

    // This is a visual snapshot of the backlog table after creating the tasks.
    await expect(page.locator('.VantageTable')).toHaveScreenshot('manager-backlog-created-tasks.png');
  });

  // This test simulates the manager filtering tasks.
  // The flow is: open Backlog, create three tasks, select a sprint, filter by assignee,
  // and verify that only the expected task remains visible.
  test('manager filters tasks by sprint and assignee @filter', async ({ page }) => {
    await openBacklog(page);

    for (const task of recordedTasks) {
      await createRecordedTask(page, task);
    }

    // This opens the assignee filter and selects Luisa.
    await page.locator('#vantage-sprint-select').selectOption('5');
    await expect(page.locator('#vantage-sprint-select')).toHaveValue('5');

    await page.getByTitle('Filter by assignee').click();
    await page.getByTestId('assignee-option-4').click();

    // Task 198 belongs to the selected assignee, so it should stay visible.
    await expect(page.getByTestId('task-row-198')).toContainText('Create task 3');

    // Task 197 does not match the filter, so it should not be visible.
    await expect(page.getByTestId('task-row-197')).not.toBeVisible();

    // Soft assertion to also check the assignee name in the table.
    await expect.soft(page.getByTestId('backlog-table')).toContainText('Luisa');
  });


  // This test simulates the manager deleting one task.
  // The flow is: open Backlog, create tasks, click the delete control for task 198,
  // confirm the delete action, and verify that the deleted task disappears.
  test('manager deletes one task and it disappears from the backlog @delete', async ({ page }) => {
    await openBacklog(page);

    for (const task of recordedTasks) {
      await createRecordedTask(page, task);
    }

    await expect(page.getByTestId('task-row-198')).toContainText('Create task 3');
    await page.getByTestId('delete-task-198').click();
    await expect(page.getByTestId('edit-task-modal')).toBeVisible();
    await page.getByTestId('confirm-delete-task-button').click();

    // Negative assertion: the deleted row should no longer be visible.
    await expect(page.getByTestId('task-row-198')).not.toBeVisible();

     // Soft assertions check that the other tasks are still there.
    await expect.soft(page.getByTestId('task-row-196')).toContainText('Create tsk 1');
    await expect.soft(page.getByTestId('task-row-197')).toContainText('Create task 2');
  });


  // This test simulates a validation error in the create task form.
  // The flow is: open Backlog, open the create task modal, submit it empty,
  // and verify that the required field error is shown.
  // It is a negative test because the user action is invalid and the app should reject it.
  test('manager sees validation when trying to create an empty task @negative', async ({ page }) => {
    await openBacklog(page);

    await page.getByTestId('create-task-button').click();
    await expect(page.getByPlaceholder(/Implement login endpoint/)).toBeVisible();
    await page.getByTestId('submit-create-task-button').click();

    await expect(page.getByText('Task name is required.')).toBeVisible();
    await expect(page.getByTestId('create-task-modal')).toBeVisible();
  });

  // This test documents a feature that is expected to fail for now.
  // The flow tries to find a delete all button, but that functionality is not implemented yet.
  // test.fail() is used because the test is expected to fail while still running.
  test.fail('documents that delete all is not implemented yet @expected-fail', async ({ page }) => {
    await openBacklog(page);
    await expect(page.getByTestId('delete-all-button')).toBeVisible();
  });

  test.skip('manager exports backlog data @download', async () => {
    // Pending because the current Backlog page does not expose a download button.
  });
});
