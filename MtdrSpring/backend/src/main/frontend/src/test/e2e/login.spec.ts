// This file is an E2E test suite for the OCI login flow.
import { test, expect } from '@playwright/test';

// Mock user for the manager role.
// This is test data, so the test does not need a real database user and the test role can be simulated as well, so we can test the role permissions in the UI.
const managerUser = {
  oracleId: 1,
  oracle_id: 1,
  name: 'Mariana Manager',
  mail: 'manager@test.com',
  role: 'MANAGER',
};

// Mock user for the developer role.
const developerUser = {
  oracleId: 2,
  oracle_id: 2,
  name: 'Diego Developer',
  mail: 'developer@test.com',
  role: 'DEVELOPER',
};

// This array is used for parameterized tests.
// Instead of repeating almost the same test twice, the same flow runs with different data.
// In this case, it is only used to check role permissions.
const rolePermissionCases = [
  {
    title: 'manager role shows analytics button',
    user: managerUser,
    shouldSeeAnalytics: true,
  },
  {
    title: 'developer role hides analytics button',
    user: developerUser,
    shouldSeeAnalytics: false,
  },
];

// The tags @login and @oci help identify what this suite is testing.
test.describe('OCI login suite and role access @login @oci', () => {
  test.beforeAll(async () => {
    console.log('Starting OCI login E2E suite');
  });

  // beforeEach runs before every test.
  // Here the clock is fixed so tests that depend on time are reproducible.
  test.beforeEach(async ({ page }) => {
    await page.clock.install({
      time: new Date('2026-06-12T09:00:00'),
    });
  });

  // It takes a screenshot as evidence for every test execution.
  test.afterEach(async ({ page }, testInfo) => {
    await page.screenshot({
      path: testInfo.outputPath('login-screenshot.png'),
      fullPage: true,
    });
  });

  // afterAll runs once after all tests in this suite.
  test.afterAll(async () => {
    console.log('Finished OCI login E2E suite');
  });

  // This test checks the negative login case.
  // It is used to make sure that if OCI authorization does not return a valid user,
  // the app stays in the authentication screen and does not open the main app shell.
  test('does not sign in when OCI authorization fails @negative', async ({ page }) => {
    // page.route intercepts the /users/me request.
    // route.fulfill returns a fake response, so the real API is never called.
    await page.route('**/users/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not authenticated' }),
      });
    });

    // This mocks the OCI authorization endpoint.
    // The redirect is simulated, but the user still stays unauthenticated.
    await page.route('**/oauth2/authorization/oci', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <script>
                window.location.href = 'http://localhost:3000/';
              </script>
            </body>
          </html>
        `,
      });
    });

    await page.goto('/');

    // toBeVisible is an auto-retrying assertion.
    await expect(page.getByRole('region', { name: 'Authentication' })).toBeVisible();

    // click uses Playwright auto-waiting before interacting with the element.
    await page.getByTitle('Start sign in').click();

    await expect(page.getByTestId('auth-root')).toBeVisible();

    // This is a negative assertion.
    // The app shell should not appear because login failed.
    await expect(page.getByTestId('vantage-shell')).not.toBeVisible();
  });

  // This test checks the complete happy path for a manager.
  // It verifies that the manager can sign in, see the app shell,
  // see the Analytics button, open Analytics, and view the manager dashboard.
  test('signs in with OCI as manager and opens analytics @manager @analytics', async ({ page }) => {
    // test.slow is an annotation, it tells Playwright this test may take more time than normal.
    test.slow();

    // This is a non-retrying assertion because it checks a normal JS object,
    // not something from the browser UI.
    expect(managerUser.role).toBe('MANAGER');

    // simulates whether the user already clicked the OCI sign in.
    let authorized = false;

    // This route mocks the current user endpoint.
    // First it returns 401, then after sign in it returns the manager user.
    await page.route('**/users/me', async (route) => {
      if (!authorized) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not authenticated' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(managerUser),
      });
    });

    // This route simulates the OCI sign in flow.
    // When the app calls this route, the test changes authorized to true.
    await page.route('**/oauth2/authorization/oci', async (route) => {
      authorized = true;

      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <script>
                window.location.href = 'http://localhost:3000/';
              </script>
            </body>
          </html>
        `,
      });
    });

    await page.goto('/');

    // toHaveURL is an auto-retrying assertion for navigation.
    await expect(page).toHaveURL('/');

    // getByRole is preferred because it is close to how a user sees the page.
    await page.getByRole('button', { name: 'SIGN IN' }).click();

    // Soft assertions do not stop the test immediately if one fails.
    // They are useful when checking several UI elements in the same screen.
    await expect.soft(page.getByTestId('vantage-shell')).toBeVisible();
    await expect.soft(page.getByText('Mariana Manager')).toBeVisible();
    await expect.soft(page.getByTestId('sidebar-link-analytics')).toBeVisible();

    await page.getByTestId('sidebar-link-analytics').click();

    // These assertions validate the manager analytics page.
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByText('MANAGER VIEW')).toBeVisible();

    // This is a visual snapshot.
    // Playwright compares the current screenshot with the saved baseline.
    await expect(page.getByTestId('vantage-shell')).toHaveScreenshot('manager-oci-login.png');
  });

  // These tests check role permissions using parameterization.
  // The same login flow is reused with different users, but the purpose is not to repeat the manager test.
  // The purpose is only to verify that each role sees the correct UI permissions.
  for (const roleCase of rolePermissionCases) {
    test(`${roleCase.title} @parameterized @roles`, async ({ page }) => {
      // Non-retrying assertion because this checks test data, not UI.
      expect(roleCase.user.role).toBeDefined();

      let authorized = false;

      // This mocks /users/me using the current parameterized user.
      await page.route('**/users/me', async (route) => {
        await route.fulfill({
          status: authorized ? 200 : 401,
          contentType: 'application/json',
          body: JSON.stringify(
            authorized
              ? roleCase.user
              : { message: 'Not authenticated' }
          ),
        });
      });

      // This simulates the OCI authorization request.
      await page.route('**/oauth2/authorization/oci', async (route) => {
        authorized = true;

        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <html>
              <body>
                <script>
                  window.location.href = 'http://localhost:3000/';
                </script>
              </body>
            </html>
          `,
        });
      });

      await page.goto('/');

      // getByTestId is used here because the sign in button has a stable test id.
      await page.getByTestId('sign-in-button').click();

      await expect(page.getByTestId('vantage-shell')).toBeVisible();

      // Soft assertion to keep checking the rest of the test even if the name fails.
      await expect.soft(page.getByText(roleCase.user.name)).toBeVisible();

      // This validates role-based UI permissions.
      // Manager should see Analytics, Developer should not.
      if (roleCase.shouldSeeAnalytics) {
        await expect(page.getByTestId('sidebar-link-analytics')).toBeVisible();
      } else {
        await expect(page.getByTestId('sidebar-link-analytics')).not.toBeVisible();
      }
    });
  }

  // test.skip is an annotation.
  // The test is documented, but it does not run because the feature is not ready.
  test.skip('download analytics data @download', async () => {
    // Pending because there is still no visible download button in Analytics.
  });
});
