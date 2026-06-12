# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: manager-backlog.spec.ts >> Manager backlog suite with HAR @manager @backlog @har >> documents that delete all is not implemented yet @expected-fail
- Location: src\test\e2e\manager-backlog.spec.ts:311:8

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('delete-all-button')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('delete-all-button')

```

```yaml
- complementary:
  - text: VANTAGE
  - button "Hide sidebar": ⟨
  - searchbox "Search for projects or teams"
  - button "PROJECTS 1 ▾" [expanded]
  - button "01 SIXTH SEMESTER ▾" [expanded]
  - button "BACKLOG"
  - button "BOARD"
  - button "ANALYTICS"
  - button "AI ANALYTICS"
  - button "TEAMS 1 ▸"
  - button "Profile"
  - button "Logout"
  - button "Settings" [disabled]
- banner:
  - button "Hide sidebar": ☰
  - text: "Backlog Project: SIXTH SEMESTER • Team: PLACEHOLDER TEAM • Sprint: All sprints • 👤 Marisa SPRINT"
  - combobox:
    - option "All sprints" [selected]
    - option "Sprint 3"
    - option "Sprint 0"
    - option "Sprint 4"
    - option "Sprint 1"
    - option "Sprint 2"
  - text: ▾
- main:
  - heading "Backlog" [level=1]
  - text: "Project: SIXTH SEMESTER • Sprint: All sprints Backlog items"
  - button "Assign to Sprint":
    - img
    - text: Assign to Sprint
  - button "+ Create Task"
  - table:
    - rowgroup:
      - 'row "Title Category Status Due Date Sprint # Assignee Filter Points Defects"':
        - columnheader "Title"
        - columnheader "Category"
        - columnheader "Status"
        - columnheader "Due Date"
        - 'columnheader "Sprint #"'
        - columnheader "Assignee Filter":
          - button "Assignee Filter":
            - text: Assignee
            - img
        - columnheader "Points"
        - columnheader "Defects"
        - columnheader
    - rowgroup:
      - row "No tasks yet. Click \"+ Create Task\" to add one.":
        - cell "No tasks yet. Click \"+ Create Task\" to add one."
  - button "+ CREATE NEW SPRINT"
```

# Test source

```ts
  213 |   await page.getByLabel('Category').selectOption(task.category);
  214 |   await page.getByLabel('Sprint', { exact: true }).selectOption(task.sprint);
  215 |   await page.getByLabel('Estimated Completion Time').fill(task.estimatedHours);
  216 |   await page.getByLabel('Due Date').fill(task.dueDate);
  217 |   await page.getByTestId('submit-create-task-button').click();
  218 | 
  219 |   await expect(page.getByTestId('create-task-modal')).not.toBeVisible();
  220 |   await expect(page.getByTestId(`task-row-${task.id}`)).toContainText(task.name);
  221 | }
  222 | 
  223 | test.describe('Manager backlog suite with HAR @manager @backlog @har', () => {
  224 |   test.beforeAll(async () => {
  225 |     console.log('Starting manager backlog HAR suite');
  226 |   });
  227 | 
  228 |   test.beforeEach(async ({ page }) => {
  229 |     await page.clock.install({
  230 |       time: new Date('2026-06-12T09:00:00'),
  231 |     });
  232 | 
  233 |     await useRecordedHarAndManagerSession(page);
  234 |   });
  235 | 
  236 |   test.afterEach(async ({ page }, testInfo) => {
  237 |     await page.screenshot({
  238 |       path: testInfo.outputPath('manager-backlog-screenshot.png'),
  239 |       fullPage: true,
  240 |     });
  241 |   });
  242 | 
  243 |   test.afterAll(async () => {
  244 |     console.log('Finished manager backlog HAR suite');
  245 |   });
  246 | 
  247 |   test('manager creates three tasks and sees them in backlog @create @parameterized', async ({ page }) => {
  248 |     test.slow();
  249 |     expect(recordedTasks).toHaveLength(3);
  250 | 
  251 |     await openBacklog(page);
  252 | 
  253 |     for (const task of recordedTasks) {
  254 |       await createRecordedTask(page, task);
  255 |       await expect.soft(page.getByText(task.description)).toBeVisible();
  256 |     }
  257 | 
  258 |     await expect(page.getByTestId('backlog-table')).toContainText('Create tsk 1');
  259 |     await expect(page.getByTestId('backlog-table')).toContainText('Create task 2');
  260 |     await expect(page.getByTestId('backlog-table')).toContainText('Create task 3');
  261 | 
  262 |     await expect(page.locator('.VantageTable')).toHaveScreenshot('manager-backlog-created-tasks.png');
  263 |   });
  264 | 
  265 |   test('manager filters tasks by sprint and assignee @filter', async ({ page }) => {
  266 |     await openBacklog(page);
  267 | 
  268 |     for (const task of recordedTasks) {
  269 |       await createRecordedTask(page, task);
  270 |     }
  271 | 
  272 |     await page.locator('#vantage-sprint-select').selectOption('5');
  273 |     await expect(page.locator('#vantage-sprint-select')).toHaveValue('5');
  274 | 
  275 |     await page.getByTitle('Filter by assignee').click();
  276 |     await page.getByTestId('assignee-option-4').click();
  277 | 
  278 |     await expect(page.getByTestId('task-row-198')).toContainText('Create task 3');
  279 |     await expect(page.getByTestId('task-row-197')).not.toBeVisible();
  280 |     await expect.soft(page.getByTestId('backlog-table')).toContainText('Luisa');
  281 |   });
  282 | 
  283 |   test('manager deletes one task and it disappears from the backlog @delete', async ({ page }) => {
  284 |     await openBacklog(page);
  285 | 
  286 |     for (const task of recordedTasks) {
  287 |       await createRecordedTask(page, task);
  288 |     }
  289 | 
  290 |     await expect(page.getByTestId('task-row-198')).toContainText('Create task 3');
  291 |     await page.getByTestId('delete-task-198').click();
  292 |     await expect(page.getByTestId('edit-task-modal')).toBeVisible();
  293 |     await page.getByTestId('confirm-delete-task-button').click();
  294 | 
  295 |     await expect(page.getByTestId('task-row-198')).not.toBeVisible();
  296 |     await expect.soft(page.getByTestId('task-row-196')).toContainText('Create tsk 1');
  297 |     await expect.soft(page.getByTestId('task-row-197')).toContainText('Create task 2');
  298 |   });
  299 | 
  300 |   test('manager sees validation when trying to create an empty task @negative', async ({ page }) => {
  301 |     await openBacklog(page);
  302 | 
  303 |     await page.getByTestId('create-task-button').click();
  304 |     await expect(page.getByPlaceholder(/Implement login endpoint/)).toBeVisible();
  305 |     await page.getByTestId('submit-create-task-button').click();
  306 | 
  307 |     await expect(page.getByText('Task name is required.')).toBeVisible();
  308 |     await expect(page.getByTestId('create-task-modal')).toBeVisible();
  309 |   });
  310 | 
  311 |   test.fail('documents that delete all is not implemented yet @expected-fail', async ({ page }) => {
  312 |     await openBacklog(page);
> 313 |     await expect(page.getByTestId('delete-all-button')).toBeVisible();
      |                                                         ^ Error: expect(locator).toBeVisible() failed
  314 |   });
  315 | 
  316 |   test.skip('manager exports backlog data @download', async () => {
  317 |     // Pending because the current Backlog page does not expose a download button.
  318 |   });
  319 | });
  320 | 
```