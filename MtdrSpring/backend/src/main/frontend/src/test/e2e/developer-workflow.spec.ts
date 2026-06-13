import { test, expect, type Page } from '@playwright/test';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

interface TestTask {
  taskId: number;
  taskName: string;
  description: string;
  status: TaskStatus;
  category: 'FEATURE' | 'BUG' | 'ISSUE';
  storyPoints: number;
  dueDate: string;
  sprintId: number;
  createdBy: number;
}

interface TestBug {
  bugId: number;
  taskId: number;
  description: string;
  reportedBy: number;
  solvedBy: number | null;
}

// Mock user for the developer role.
// This simulates that the logged user is a developer without using OCI or the real backend.
const developerUser = {
  oracle_id: 2,
  oracleId: 2,
  name: 'Diego Developer',
  mail: 'developer@test.com',
  role: 'DEVELOPER',
};

// Mock sprint used by the backlog.
// This gives the UI data for the sprint dropdown and task table.
const sprints = [
  { sprintId: 1, sprintName: 'Sprint 1', goal: 'Developer workflow' },
];

// Mock users.
// The developer is the logged user and the manager is the creator of the tasks.
const users = [
  developerUser,
  {
    oracle_id: 6,
    oracleId: 6,
    name: 'Marisa Manager',
    mail: 'manager@test.com',
    role: 'MANAGER',
  },
];

// Initial mocked tasks assigned to the developer.
// These are the tasks that the developer will see in the backlog.
const initialTasks: TestTask[] = [
  {
    taskId: 501,
    taskName: 'Completed task with defect',
    description: 'Task ready for bug reporting',
    status: 'DONE',
    category: 'FEATURE',
    storyPoints: 3,
    dueDate: '2026-06-15',
    sprintId: 1,
    createdBy: 6,
  },
  {
    taskId: 502,
    taskName: 'Finish API validation',
    description: 'Complete task and log actual hours',
    status: 'IN_PROGRESS',
    category: 'FEATURE',
    storyPoints: 5,
    dueDate: '2026-06-16',
    sprintId: 1,
    createdBy: 6,
  },
  {
    taskId: 503,
    taskName: 'Start UI polish',
    description: 'Move task into progress',
    status: 'TODO',
    category: 'FEATURE',
    storyPoints: 2,
    dueDate: '2026-06-17',
    sprintId: 1,
    createdBy: 6,
  },
  {
    taskId: 504,
    taskName: 'Review blocked dependency',
    description: 'Mark task as blocked',
    status: 'TODO',
    category: 'ISSUE',
    storyPoints: 1,
    dueDate: '2026-06-18',
    sprintId: 1,
    createdBy: 6,
  },
];

// This connects the developer with the mocked tasks.
// It is used by the UI to know which tasks are assigned to Diego.
const initialAssignees = [
  { taskId: 501, oracleId: 2, oracle_id: 2, estimatedCompletionTime: 3, realTimeSpent: 2 },
  { taskId: 502, oracleId: 2, oracle_id: 2, estimatedCompletionTime: 5, realTimeSpent: 0 },
  { taskId: 503, oracleId: 2, oracle_id: 2, estimatedCompletionTime: 2, realTimeSpent: 0 },
  { taskId: 504, oracleId: 2, oracle_id: 2, estimatedCompletionTime: 1, realTimeSpent: 0 },
];

// These cases are used for parameterized tests.
// The same test flow changes different tasks to different statuses.
const statusCases: Array<{
  taskId: number;
  name: string;
  nextStatus: TaskStatus;
  actualHours?: string;
}> = [
  { taskId: 502, name: 'Finish API validation', nextStatus: 'DONE', actualHours: '4' },
  { taskId: 503, name: 'Start UI polish', nextStatus: 'IN_PROGRESS' },
  { taskId: 504, name: 'Review blocked dependency', nextStatus: 'BLOCKED' },
];

// This function prepares the fake backend for the developer tests.
// It uses page.route() to intercept API requests and return controlled responses.
// This way the tests never depend on the real backend or database.
async function mockDeveloperApi(page: Page) {
  // These arrays are like a temporary database inside the test.
  // If the UI updates a task or bug, the array changes too.
  const tasks = initialTasks.map((task) => ({ ...task }));
  const assignees = initialAssignees.map((assignee) => ({ ...assignee }));
  const bugs: TestBug[] = [
    {
      bugId: 901,
      taskId: 501,
      description: 'Existing defect found during review',
      reportedBy: 2,
      solvedBy: null,
    },
  ];

  let nextBugId = 902;

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    // Small helper to respond JSON without repeating the same code many times.
    const fulfillJson = async (body: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };

    // This mocks the current logged user.
    // The frontend thinks Diego is already logged in as developer.
    if (path === '/users/me' && method === 'GET') {
      await fulfillJson(developerUser);
      return;
    }

    // This mocks all users.
    if (path === '/users' && method === 'GET') {
      await fulfillJson(users);
      return;
    }

    // This mocks the developers list.
    if (path === '/users/developers' && method === 'GET') {
      await fulfillJson([developerUser]);
      return;
    }

    // This mocks the sprint list.
    if (path === '/sprints' && method === 'GET') {
      await fulfillJson(sprints);
      return;
    }

    // This mocks the task list.
    if (path === '/tasks' && method === 'GET') {
      await fulfillJson(tasks);
      return;
    }

    // This mocks the task assignees list.
    if (path === '/tasks/assignees/all' && method === 'GET') {
      await fulfillJson(assignees);
      return;
    }

    // This mocks the bugs list.
    if (path === '/bugs' && method === 'GET') {
      await fulfillJson(bugs);
      return;
    }

    // This mocks the flow where a developer completes a task.
    // It updates the task status to DONE and saves the real time spent.
    const completeMatch = path.match(/^\/tasks\/(\d+)\/complete$/);
    if (completeMatch && method === 'POST') {
      const taskId = Number(completeMatch[1]);
      const body = request.postDataJSON() as { realTimeSpent: number };
      const task = tasks.find((item) => item.taskId === taskId);

      if (task) {
        task.status = 'DONE';
      }

      const assignee = assignees.find((item) => item.taskId === taskId);
      if (assignee) {
        assignee.realTimeSpent = body.realTimeSpent;
      }

      await fulfillJson(task);
      return;
    }

    // This mocks updating a task status.
    // For example: TODO to IN_PROGRESS or TODO to BLOCKED.
    const taskMatch = path.match(/^\/tasks\/(\d+)$/);
    if (taskMatch && method === 'PUT') {
      const taskId = Number(taskMatch[1]);
      const body = request.postDataJSON() as Partial<TestTask>;
      const task = tasks.find((item) => item.taskId === taskId);

      if (task && body.status) {
        task.status = body.status;
      }

      await fulfillJson(task);
      return;
    }

    // This mocks creating a new bug report.
    // The new bug is stored in the bugs array so the UI can show it later.
    if (path === '/bugs' && method === 'POST') {
      const body = request.postDataJSON() as Partial<TestBug>;
      const bug = {
        bugId: nextBugId,
        taskId: Number(body.taskId),
        description: String(body.description),
        reportedBy: Number(body.reportedBy),
        solvedBy: null,
      };

      nextBugId += 1;
      bugs.push(bug);
      await fulfillJson(bug, 201);
      return;
    }

    // This mocks getting bugs for one specific task.
    const bugsByTaskMatch = path.match(/^\/bugs\/task\/(\d+)$/);
    if (bugsByTaskMatch && method === 'GET') {
      const taskId = Number(bugsByTaskMatch[1]);
      await fulfillJson(bugs.filter((bug) => bug.taskId === taskId));
      return;
    }

    // This mocks marking a bug as solved.
    const solveBugMatch = path.match(/^\/bugs\/(\d+)\/solve$/);
    if (solveBugMatch && method === 'PUT') {
      const bugId = Number(solveBugMatch[1]);
      const body = request.postDataJSON() as { solvedBy: number };
      const bug = bugs.find((item) => item.bugId === bugId);

      if (bug) {
        bug.solvedBy = body.solvedBy;
      }

      await fulfillJson(bug);
      return;
    }

    // If this is an API request and it was not mocked above, return 404.
    // This keeps the rule that API requests should not hit the real backend.
    const isApiRequest =
      path.startsWith('/users') ||
      path.startsWith('/tasks') ||
      path.startsWith('/sprints') ||
      path.startsWith('/bugs') ||
      path.startsWith('/logout') ||
      path.startsWith('/oauth2');

    if (isApiRequest) {
      await fulfillJson({ message: `Mock not found for ${method} ${path}` }, 404);
      return;
    }

    // Frontend files like /, bundle.js, css, and images must still load from the React dev server.
    await route.continue();
  });
}

// This helper opens the app and goes to the developer backlog.
// It keeps the tests cleaner because many tests start with this same flow.
async function openDeveloperBacklog(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('vantage-shell')).toBeVisible();
  await page.getByTestId('sidebar-link-backlog').click();
  await expect(page.getByRole('heading', { name: 'Backlog' })).toBeVisible();
  await expect(page.getByTestId('backlog-table')).toBeVisible();
}

test.describe('Developer workflow suite @developer @tasks @bugs', () => {
  test.beforeAll(async () => {
    console.log('Starting developer workflow suite');
  });

  // beforeEach runs before every test.
  // It fixes the clock and prepares the mocked API before the page loads.
  test.beforeEach(async ({ page }) => {
    await page.clock.install({
      time: new Date('2026-06-12T09:00:00'),
    });

    await mockDeveloperApi(page);
  });

  // afterEach takes a screenshot after each test.
  // This is evidence of the test execution.
  test.afterEach(async ({ page }, testInfo) => {
    await page.screenshot({
      path: testInfo.outputPath('developer-workflow-screenshot.png'),
      fullPage: true,
    });
  });

  test.afterAll(async () => {
    console.log('Finished developer workflow suite');
  });

  // This test checks the first developer workflow.
  // It simulates Diego opening the backlog and seeing only his assigned tasks.
  // It also verifies that the developer does not see manager-only Analytics access.
  test('developer sees assigned tasks and no manager analytics @assigned', async ({ page }) => {
    await openDeveloperBacklog(page);

    // Non-retrying assertion because this checks normal test data.
    expect(initialAssignees).toHaveLength(4);

    await expect(page.getByText('Completed task with defect')).toBeVisible();
    await expect(page.getByText('Finish API validation')).toBeVisible();
    await expect(page.getByText('Start UI polish')).toBeVisible();
    await expect(page.getByText('Review blocked dependency')).toBeVisible();

    // Negative assertion: developer should not see Analytics.
    await expect(page.getByTestId('sidebar-link-analytics')).not.toBeVisible();

    // Soft assertion keeps checking even if this one fails.
    await expect.soft(page.getByTestId('backlog-table')).toContainText('Diego');

    // Visual snapshot of the assigned tasks table.
    await expect(page.locator('.VantageTable')).toHaveScreenshot('developer-assigned-tasks.png');
  });

  // These tests use parameterization.
  // The same status update flow runs for multiple tasks with different final statuses.
  for (const statusCase of statusCases) {
    test(`developer changes "${statusCase.name}" to ${statusCase.nextStatus} @status @parameterized`, async ({ page }) => {
      // test.slow is an annotation because this flow has more steps.
      test.slow();

      await openDeveloperBacklog(page);

      await expect(page.getByTestId(`task-row-${statusCase.taskId}`)).toContainText(statusCase.name);

      // selectOption changes the task status like a user would do from a dropdown.
      await page.getByTestId(`task-status-${statusCase.taskId}`).selectOption(statusCase.nextStatus);

      // If the developer marks a task as DONE, the app asks for actual hours.
      if (statusCase.nextStatus === 'DONE') {
        await expect(page.getByTestId('actual-hours-modal')).toBeVisible();
        await page.getByTestId('actual-hours-input').fill(statusCase.actualHours ?? '1');
        await page.getByTestId('submit-actual-hours-button').click();
        await expect(page.getByTestId('actual-hours-modal')).not.toBeVisible();
      }

      await expect(page.getByTestId(`task-status-${statusCase.taskId}`)).toHaveValue(statusCase.nextStatus);
      await expect.soft(page.getByTestId(`task-row-${statusCase.taskId}`)).toContainText(statusCase.name);
    });
  }

  // This test simulates a developer reporting a bug on a completed task.
  // The flow is: open backlog, click report bug, fill the bug description,
  // submit the form, and verify that the bug count appears in the task row.
  test('developer reports a bug on a completed task @bug-report', async ({ page }) => {
    await openDeveloperBacklog(page);

    await page.getByTestId('report-bug-501').click();
    await expect(page.getByTestId('report-bug-modal')).toBeVisible();

    await expect(page.getByPlaceholder(/Describe the error/)).toBeVisible();
    await page.getByLabel('Bug Description').fill('New defect reported by developer E2E test');
    await page.getByTestId('submit-bug-report-button').click();

    await expect(page.getByTestId('report-bug-modal')).not.toBeVisible();
    await expect(page.getByTestId('view-bugs-501')).toBeVisible();
    await expect.soft(page.getByTestId('backlog-table')).toContainText('2');
  });

  // This test simulates a developer opening the bug log and solving an existing bug.
  // The flow is: open backlog, view bugs for a task, click mark solved,
  // and verify that the bug log now shows the bug as solved.
  test('developer opens bug log and marks a bug as solved @bug-solve', async ({ page }) => {
    await openDeveloperBacklog(page);

    await page.getByTestId('view-bugs-501').click();
    await expect(page.getByTestId('view-bugs-modal')).toBeVisible();

    await expect(page.getByTestId('bug-row-901')).toContainText('Existing defect found during review');
    await page.getByTitle('Mark bug 901 solved').click();

    await expect(page.getByText('0 Open')).toBeVisible();
    await expect(page.getByText('1 Solved')).toBeVisible();
    await expect.soft(page.getByTestId('bug-row-901')).toContainText('solved');
  });

  // This is a negative test.
  // It simulates the developer trying to report a bug without writing a description.
  // The app should keep the modal open and show a validation message.
  test('developer sees validation when reporting an empty bug @negative', async ({ page }) => {
    await openDeveloperBacklog(page);

    await page.getByTestId('report-bug-501').click();
    await expect(page.getByTestId('report-bug-modal')).toBeVisible();

    await page.getByTestId('submit-bug-report-button').click();

    await expect(page.getByText('Bug description is required.')).toBeVisible();
    await expect(page.getByTestId('report-bug-modal')).toBeVisible();
  });

  // test.fail documents a feature/status that is not available yet.
  // It still runs, but Playwright expects it to fail.
  test.fail('documents that TESTING status is not available yet @expected-fail', async ({ page }) => {
    await openDeveloperBacklog(page);
    const availableStatuses = await page
      .getByTestId('task-status-503')
      .locator('option')
      .evaluateAll((options) => options.map((option) => option.getAttribute('value')));

    expect(availableStatuses).toContain('TESTING');
  });

  // test.skip is a pending test.
  // It is documented, but it does not run because there is no download button yet.
  test.skip('developer downloads completed task evidence @download', async () => {
    // Pending because the developer task screen does not expose a download button.
  });
});
