import { test, expect } from '@playwright/test';

test.describe('Complete Fixture Picking Flow', () => {
  test('should test complete picking workflow with database setup', async ({ page, request }) => {
    const timestamp = Date.now();
    
    // Step 1: Create template
    const templateData = {
      name: `Complete Flow Test ${timestamp}`,
      gameType: "LMS",
      sport: "EPL",
      status: "PUBLISHED",
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      activationOpenAt: new Date(Date.now() - 1000).toISOString(),
      activationCloseAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      joinOpenAt: new Date(Date.now() - 1000).toISOString(),
      joinCloseAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      rulesJson: '{"noReuseTeam":true}'
    };

    const createTemplateResponse = await request.post('http://localhost:4000/templates', {
      data: templateData
    });
    expect(createTemplateResponse.ok()).toBeTruthy();
    const template = await createTemplateResponse.json();

    // Step 2: Get club and activate template
    const clubResponse = await request.get('http://localhost:4000/clubs/by-slug/cavan-gaa');
    const club = await clubResponse.json();

    const activateResponse = await request.post(`http://localhost:4000/clubs/${club.id}/activate-template/${template.id}`, {
      data: { entryFeeCents: 1000, currency: "EUR" }
    });
    expect(activateResponse.ok()).toBeTruthy();
    const competition = await activateResponse.json();

    // Step 3: Open competition
    const openResponse = await request.post(`http://localhost:4000/competitions/${competition.id}/open`);
    expect(openResponse.ok()).toBeTruthy();

    // Step 4: Join competition
    const userEmail = `testuser${timestamp}@example.com`;
    const joinResponse = await request.post(`http://localhost:4000/competitions/${competition.id}/entries`, {
      data: { email: userEmail, name: "Test User" }
    });
    expect(joinResponse.ok()).toBeTruthy();

    // Step 5: Visit competition page and verify it loads
    await page.goto(`/competitions/${competition.id}`);
    await expect(page.locator('h3')).toContainText(`Complete Flow Test ${timestamp}`);
    await expect(page.locator('text=OPEN')).toBeVisible();
    await expect(page.locator('text=EUR 10.00')).toBeVisible();

    // Step 6: Verify no rounds message is shown (since we haven't created any rounds/fixtures)
    await expect(page.locator('text=No rounds or fixtures available yet')).toBeVisible();

    console.log('Complete workflow test passed - competition created, opened, joined, and page displays correctly');
  });

  test('should test UI components when no fixtures are available', async ({ page, request }) => {
    const timestamp = Date.now();
    
    // Create a basic competition
    const templateData = {
      name: `UI Test ${timestamp}`,
      gameType: "LMS",
      sport: "EPL",
      status: "PUBLISHED",
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      activationOpenAt: new Date(Date.now() - 1000).toISOString(),
      activationCloseAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      joinOpenAt: new Date(Date.now() - 1000).toISOString(),
      joinCloseAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      rulesJson: '{"noReuseTeam":true}'
    };

    const createTemplateResponse = await request.post('http://localhost:4000/templates', { data: templateData });
    const template = await createTemplateResponse.json();

    const clubResponse = await request.get('http://localhost:4000/clubs/by-slug/cavan-gaa');
    const club = await clubResponse.json();

    const activateResponse = await request.post(`http://localhost:4000/clubs/${club.id}/activate-template/${template.id}`, {
      data: { entryFeeCents: 500, currency: "EUR" }
    });
    const competition = await activateResponse.json();

    await request.post(`http://localhost:4000/competitions/${competition.id}/open`);

    // Visit the competition page
    await page.goto(`/competitions/${competition.id}`);

    // Test UI elements
    await expect(page.locator('h3')).toContainText(`UI Test ${timestamp}`);
    
    // Check status badge styling
    const statusElement = page.locator('text=OPEN').first();
    await expect(statusElement).toHaveClass(/text-green-600/);

    // Verify responsive design elements
    await expect(page.locator('.grid.md\\:grid-cols-2')).toBeVisible();
    
    // Check that the page is properly styled
    await expect(page.locator('main')).toHaveClass(/bg-gradient-to-b/);

    console.log('UI component tests completed successfully');
  });

  test('should verify API error responses', async ({ request }) => {
    // Test invalid competition ID
    const invalidCompResponse = await request.get('http://localhost:4000/competitions/invalid-id');
    expect(invalidCompResponse.status()).toBe(404);
    
    const errorData = await invalidCompResponse.json();
    expect(errorData.error).toBe('Competition not found');

    // Test picks endpoint with invalid fixture
    const invalidPickResponse = await request.post('http://localhost:4000/picks', {
      data: {
        email: "test@example.com",
        fixtureId: "invalid-fixture-id",
        teamPicked: "Arsenal"
      }
    });
    expect(invalidPickResponse.status()).toBe(404);

    console.log('API error response tests completed successfully');
  });
});