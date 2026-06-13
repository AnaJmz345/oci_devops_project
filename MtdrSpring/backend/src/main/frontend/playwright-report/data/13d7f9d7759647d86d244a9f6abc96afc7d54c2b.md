# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: developer-workflow.spec.ts >> Developer workflow suite @developer @tasks @bugs >> documents that TESTING status is not available yet @expected-fail
- Location: src\test\e2e\developer-workflow.spec.ts:442:8

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: "TESTING"
Received array: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - complementary [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]: VANTAGE
      - button "Hide sidebar" [ref=e5] [cursor=pointer]: ⟨
    - searchbox "Search for projects or teams" [ref=e7]
    - generic [ref=e8]:
      - button "PROJECTS 1 ▾" [expanded] [ref=e9] [cursor=pointer]:
        - generic [ref=e10]: PROJECTS
        - generic [ref=e11]: "1"
        - generic [ref=e12]: ▾
      - generic [ref=e13]:
        - button "01 SIXTH SEMESTER ▾" [expanded] [ref=e14] [cursor=pointer]:
          - generic [ref=e15]: "01"
          - generic [ref=e16]: SIXTH SEMESTER
          - generic [ref=e17]: ▾
        - generic [ref=e18]:
          - button "BACKLOG" [active] [ref=e19] [cursor=pointer]
          - button "BOARD" [ref=e20] [cursor=pointer]
    - button "TEAMS 1 ▸" [ref=e22] [cursor=pointer]:
      - generic [ref=e23]: TEAMS
      - generic [ref=e24]: "1"
      - generic [ref=e25]: ▸
    - generic [ref=e26]:
      - button "Profile" [ref=e27] [cursor=pointer]:
        - img [ref=e28]
      - button "Logout" [ref=e31] [cursor=pointer]: Logout
      - button "Settings" [disabled] [ref=e32]:
        - img [ref=e33]
  - generic [ref=e35]:
    - banner [ref=e36]:
      - generic [ref=e37]:
        - button "Hide sidebar" [ref=e38] [cursor=pointer]
        - generic [ref=e39]:
          - generic [ref=e40]: Backlog
          - generic [ref=e41]:
            - text: "Project: SIXTH SEMESTER • Team: PLACEHOLDER TEAM • Sprint: All sprints"
            - generic [ref=e42]: • 👤 Diego Developer
      - generic [ref=e44]:
        - generic [ref=e45]: SPRINT
        - combobox "Sprint Filter" [ref=e46] [cursor=pointer]:
          - option "All sprints" [selected]
          - option "Sprint 1"
        - generic: ▾
    - main [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]:
          - heading "Backlog" [level=1] [ref=e50]
          - generic [ref=e51]: "Project: SIXTH SEMESTER • Sprint: All sprints"
        - generic [ref=e52]:
          - generic [ref=e54]:
            - text: Backlog items
            - generic [ref=e55]: (4)
          - table [ref=e57]:
            - rowgroup [ref=e58]:
              - 'row "Title Category Status Due Date Sprint # Assignee Filter Points Defects" [ref=e59]':
                - columnheader "Title" [ref=e60]
                - columnheader "Category" [ref=e61]
                - columnheader "Status" [ref=e62]
                - columnheader "Due Date" [ref=e63]
                - 'columnheader "Sprint #" [ref=e64]'
                - columnheader "Assignee Filter" [ref=e65]:
                  - button "Assignee Filter" [ref=e67] [cursor=pointer]:
                    - generic [ref=e68]: Assignee
                    - img [ref=e69]
                - columnheader "Points" [ref=e71]
                - columnheader "Defects" [ref=e72]
            - rowgroup [ref=e73]:
              - row "Completed task with defect Task ready for bug reporting FEATURE DONE Jun 15, 2026 Sprint 1 D Diego 3 View bugs for Completed task with defect Report bug for Completed task with defect" [ref=e74]:
                - cell "Completed task with defect Task ready for bug reporting" [ref=e75]:
                  - generic [ref=e76]: Completed task with defect
                  - generic [ref=e77]: Task ready for bug reporting
                - cell "FEATURE" [ref=e78]:
                  - combobox [ref=e79] [cursor=pointer]:
                    - option "FEATURE" [selected]
                    - option "BUG"
                    - option "ISSUE"
                - cell "DONE" [ref=e80]:
                  - combobox "Status for Completed task with defect" [ref=e81] [cursor=pointer]:
                    - option "TODO"
                    - option "IN PROGRESS"
                    - option "DONE" [selected]
                    - option "BLOCKED"
                - cell "Jun 15, 2026" [ref=e82]
                - cell "Sprint 1" [ref=e83]
                - cell "D Diego" [ref=e84]:
                  - generic [ref=e85]:
                    - generic [ref=e86]: D
                    - text: Diego
                - cell "3" [ref=e87]
                - cell "View bugs for Completed task with defect Report bug for Completed task with defect" [ref=e88]:
                  - generic [ref=e89]:
                    - generic "View bugs for Completed task with defect" [ref=e90] [cursor=pointer]:
                      - img [ref=e91]
                      - text: "1"
                    - button "Report bug for Completed task with defect" [ref=e93] [cursor=pointer]:
                      - img [ref=e94]
                      - text: Report
              - row "Finish API validation Complete task and log actual hours FEATURE IN PROGRESS Jun 16, 2026 Sprint 1 D Diego 5 —" [ref=e96]:
                - cell "Finish API validation Complete task and log actual hours" [ref=e97]:
                  - generic [ref=e98]: Finish API validation
                  - generic [ref=e99]: Complete task and log actual hours
                - cell "FEATURE" [ref=e100]:
                  - combobox [ref=e101] [cursor=pointer]:
                    - option "FEATURE" [selected]
                    - option "BUG"
                    - option "ISSUE"
                - cell "IN PROGRESS" [ref=e102]:
                  - combobox "Status for Finish API validation" [ref=e103] [cursor=pointer]:
                    - option "TODO"
                    - option "IN PROGRESS" [selected]
                    - option "DONE"
                    - option "BLOCKED"
                - cell "Jun 16, 2026" [ref=e104]
                - cell "Sprint 1" [ref=e105]
                - cell "D Diego" [ref=e106]:
                  - generic [ref=e107]:
                    - generic [ref=e108]: D
                    - text: Diego
                - cell "5" [ref=e109]
                - cell "—" [ref=e110]:
                  - generic [ref=e112]: —
              - row "Start UI polish Move task into progress FEATURE TODO Jun 17, 2026 Sprint 1 D Diego 2 —" [ref=e113]:
                - cell "Start UI polish Move task into progress" [ref=e114]:
                  - generic [ref=e115]: Start UI polish
                  - generic [ref=e116]: Move task into progress
                - cell "FEATURE" [ref=e117]:
                  - combobox [ref=e118] [cursor=pointer]:
                    - option "FEATURE" [selected]
                    - option "BUG"
                    - option "ISSUE"
                - cell "TODO" [ref=e119]:
                  - combobox "Status for Start UI polish" [ref=e120] [cursor=pointer]:
                    - option "TODO" [selected]
                    - option "IN PROGRESS"
                    - option "DONE"
                    - option "BLOCKED"
                - cell "Jun 17, 2026" [ref=e121]
                - cell "Sprint 1" [ref=e122]
                - cell "D Diego" [ref=e123]:
                  - generic [ref=e124]:
                    - generic [ref=e125]: D
                    - text: Diego
                - cell "2" [ref=e126]
                - cell "—" [ref=e127]:
                  - generic [ref=e129]: —
              - row "Review blocked dependency Mark task as blocked ISSUE TODO Jun 18, 2026 Sprint 1 D Diego 1 —" [ref=e130]:
                - cell "Review blocked dependency Mark task as blocked" [ref=e131]:
                  - generic [ref=e132]: Review blocked dependency
                  - generic [ref=e133]: Mark task as blocked
                - cell "ISSUE" [ref=e134]:
                  - combobox [ref=e135] [cursor=pointer]:
                    - option "FEATURE"
                    - option "BUG"
                    - option "ISSUE" [selected]
                - cell "TODO" [ref=e136]:
                  - combobox "Status for Review blocked dependency" [ref=e137] [cursor=pointer]:
                    - option "TODO" [selected]
                    - option "IN PROGRESS"
                    - option "DONE"
                    - option "BLOCKED"
                - cell "Jun 18, 2026" [ref=e138]
                - cell "Sprint 1" [ref=e139]
                - cell "D Diego" [ref=e140]:
                  - generic [ref=e141]:
                    - generic [ref=e142]: D
                    - text: Diego
                - cell "1" [ref=e143]
                - cell "—" [ref=e144]:
                  - generic [ref=e146]: —
```

# Test source

```ts
  349 |     await expect(page.getByText('Finish API validation')).toBeVisible();
  350 |     await expect(page.getByText('Start UI polish')).toBeVisible();
  351 |     await expect(page.getByText('Review blocked dependency')).toBeVisible();
  352 | 
  353 |     // Negative assertion: developer should not see Analytics.
  354 |     await expect(page.getByTestId('sidebar-link-analytics')).not.toBeVisible();
  355 | 
  356 |     // Soft assertion keeps checking even if this one fails.
  357 |     await expect.soft(page.getByTestId('backlog-table')).toContainText('Diego');
  358 | 
  359 |     // Visual snapshot of the assigned tasks table.
  360 |     await expect(page.locator('.VantageTable')).toHaveScreenshot('developer-assigned-tasks.png');
  361 |   });
  362 | 
  363 |   // These tests use parameterization.
  364 |   // The same status update flow runs for multiple tasks with different final statuses.
  365 |   for (const statusCase of statusCases) {
  366 |     test(`developer changes "${statusCase.name}" to ${statusCase.nextStatus} @status @parameterized`, async ({ page }) => {
  367 |       // test.slow is an annotation because this flow has more steps.
  368 |       test.slow();
  369 | 
  370 |       await openDeveloperBacklog(page);
  371 | 
  372 |       await expect(page.getByTestId(`task-row-${statusCase.taskId}`)).toContainText(statusCase.name);
  373 | 
  374 |       // selectOption changes the task status like a user would do from a dropdown.
  375 |       await page.getByTestId(`task-status-${statusCase.taskId}`).selectOption(statusCase.nextStatus);
  376 | 
  377 |       // If the developer marks a task as DONE, the app asks for actual hours.
  378 |       if (statusCase.nextStatus === 'DONE') {
  379 |         await expect(page.getByTestId('actual-hours-modal')).toBeVisible();
  380 |         await page.getByTestId('actual-hours-input').fill(statusCase.actualHours ?? '1');
  381 |         await page.getByTestId('submit-actual-hours-button').click();
  382 |         await expect(page.getByTestId('actual-hours-modal')).not.toBeVisible();
  383 |       }
  384 | 
  385 |       await expect(page.getByTestId(`task-status-${statusCase.taskId}`)).toHaveValue(statusCase.nextStatus);
  386 |       await expect.soft(page.getByTestId(`task-row-${statusCase.taskId}`)).toContainText(statusCase.name);
  387 |     });
  388 |   }
  389 | 
  390 |   // This test simulates a developer reporting a bug on a completed task.
  391 |   // The flow is: open backlog, click report bug, fill the bug description,
  392 |   // submit the form, and verify that the bug count appears in the task row.
  393 |   test('developer reports a bug on a completed task @bug-report', async ({ page }) => {
  394 |     await openDeveloperBacklog(page);
  395 | 
  396 |     await page.getByTestId('report-bug-501').click();
  397 |     await expect(page.getByTestId('report-bug-modal')).toBeVisible();
  398 | 
  399 |     await expect(page.getByPlaceholder(/Describe the error/)).toBeVisible();
  400 |     await page.getByLabel('Bug Description').fill('New defect reported by developer E2E test');
  401 |     await page.getByTestId('submit-bug-report-button').click();
  402 | 
  403 |     await expect(page.getByTestId('report-bug-modal')).not.toBeVisible();
  404 |     await expect(page.getByTestId('view-bugs-501')).toBeVisible();
  405 |     await expect.soft(page.getByTestId('backlog-table')).toContainText('2');
  406 |   });
  407 | 
  408 |   // This test simulates a developer opening the bug log and solving an existing bug.
  409 |   // The flow is: open backlog, view bugs for a task, click mark solved,
  410 |   // and verify that the bug log now shows the bug as solved.
  411 |   test('developer opens bug log and marks a bug as solved @bug-solve', async ({ page }) => {
  412 |     await openDeveloperBacklog(page);
  413 | 
  414 |     await page.getByTestId('view-bugs-501').click();
  415 |     await expect(page.getByTestId('view-bugs-modal')).toBeVisible();
  416 | 
  417 |     await expect(page.getByTestId('bug-row-901')).toContainText('Existing defect found during review');
  418 |     await page.getByTitle('Mark bug 901 solved').click();
  419 | 
  420 |     await expect(page.getByText('0 Open')).toBeVisible();
  421 |     await expect(page.getByText('1 Solved')).toBeVisible();
  422 |     await expect.soft(page.getByTestId('bug-row-901')).toContainText('solved');
  423 |   });
  424 | 
  425 |   // This is a negative test.
  426 |   // It simulates the developer trying to report a bug without writing a description.
  427 |   // The app should keep the modal open and show a validation message.
  428 |   test('developer sees validation when reporting an empty bug @negative', async ({ page }) => {
  429 |     await openDeveloperBacklog(page);
  430 | 
  431 |     await page.getByTestId('report-bug-501').click();
  432 |     await expect(page.getByTestId('report-bug-modal')).toBeVisible();
  433 | 
  434 |     await page.getByTestId('submit-bug-report-button').click();
  435 | 
  436 |     await expect(page.getByText('Bug description is required.')).toBeVisible();
  437 |     await expect(page.getByTestId('report-bug-modal')).toBeVisible();
  438 |   });
  439 | 
  440 |   // test.fail documents a feature/status that is not available yet.
  441 |   // It still runs, but Playwright expects it to fail.
  442 |   test.fail('documents that TESTING status is not available yet @expected-fail', async ({ page }) => {
  443 |     await openDeveloperBacklog(page);
  444 |     const availableStatuses = await page
  445 |       .getByTestId('task-status-503')
  446 |       .locator('option')
  447 |       .evaluateAll((options) => options.map((option) => option.getAttribute('value')));
  448 | 
> 449 |     expect(availableStatuses).toContain('TESTING');
      |                               ^ Error: expect(received).toContain(expected) // indexOf
  450 |   });
  451 | 
  452 |   // test.skip is a pending test.
  453 |   // It is documented, but it does not run because there is no download button yet.
  454 |   test.skip('developer downloads completed task evidence @download', async () => {
  455 |     // Pending because the developer task screen does not expose a download button.
  456 |   });
  457 | });
  458 | 
```