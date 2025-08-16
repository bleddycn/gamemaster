import { test, expect } from '@playwright/test';

test.describe('Template Activation Flow', () => {
  test('should create template, activate it under a club, and open the competition', async ({ page, request }) => {
    // First, let's create a template via API
    const timestamp = Date.now();
    const templateData = {
      name: `E2E Test LMS - EPL ${timestamp}`,
      gameType: "LMS",
      sport: "EPL", 
      status: "PUBLISHED",
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      activationOpenAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago to ensure it's active
      activationCloseAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      joinOpenAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      joinCloseAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
      rulesJson: '{"noReuseTeam":true,"maxPicks":1}'
    };

    console.log('Creating template with data:', templateData);
    
    const createTemplateResponse = await request.post('http://localhost:4000/templates', {
      data: templateData
    });
    
    expect(createTemplateResponse.ok()).toBeTruthy();
    const template = await createTemplateResponse.json();
    console.log('Created template:', template);

    // Navigate to admin templates page to verify template was created
    await page.goto('/admin/templates');
    await expect(page.locator('h1')).toContainText('Game Templates');
    
    // Check that our template appears in the list
    await expect(page.locator('text=' + templateData.name)).toBeVisible();

    // Navigate to a club page (we'll use cavan-gaa which should exist from seed data)
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('h1')).toContainText('Cavan GAA');

    // Look for the template in the available templates section
    await expect(page.locator('h2:has-text("Available Templates")')).toBeVisible();
    
    // Wait for templates to load
    await page.waitForTimeout(1000);
    
    // Find our specific template and click activate
    const templateCard = page.locator('[class*="space-y-3"]').filter({ hasText: templateData.name }).first();
    await expect(templateCard).toBeVisible({ timeout: 10000 });
    
    // Click the activate button for our template
    const activateButton = templateCard.locator('button:has-text("Activate")');
    await expect(activateButton).toBeVisible();
    await expect(activateButton).toBeEnabled();
    await activateButton.click();

    // Wait for success message or page refresh
    await page.waitForTimeout(3000); // Give time for the activation to process

    // Verify the template was activated by checking if a new competition appears
    // The competition should now appear in the competitions list with DRAFT status
    const competitionsSection = page.locator('h2:has-text("Competitions")').locator('..');
    await expect(competitionsSection.locator(`text=${templateData.name}`)).toBeVisible({ timeout: 10000 });
    await expect(competitionsSection.locator('text=DRAFT')).toBeVisible();

    // Now test opening the competition
    // Find the "Open for entries" button and click it
    const draftCompetition = competitionsSection.locator('li').filter({ hasText: templateData.name });
    const openButton = draftCompetition.locator('button:has-text("Open for entries")');
    await expect(openButton).toBeVisible({ timeout: 5000 });
    
    await openButton.click();

    // Wait for the status to change from DRAFT to OPEN
    await page.waitForTimeout(3000);
    
    // Verify the competition status changed to OPEN and button disappeared
    await expect(competitionsSection.locator('text=OPEN')).toBeVisible({ timeout: 10000 });
    
    // The "Open for entries" button should disappear since it's no longer DRAFT
    await expect(openButton).not.toBeVisible();

    console.log('Template activation and competition opening flow completed successfully!');
  });

  test('should verify API activation endpoint works directly', async ({ request }) => {
    // Create a template first
    const timestamp = Date.now();
    const templateData = {
      name: `API Test Template ${timestamp}`,
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

    const createResponse = await request.post('http://localhost:4000/templates', { data: templateData });
    expect(createResponse.ok()).toBeTruthy();
    const template = await createResponse.json();

    // Get Cavan GAA club ID
    const clubResponse = await request.get('http://localhost:4000/clubs/by-slug/cavan-gaa');
    expect(clubResponse.ok()).toBeTruthy();
    const club = await clubResponse.json();

    // Test activation endpoint directly
    const activateResponse = await request.post(`http://localhost:4000/clubs/${club.id}/activate-template/${template.id}`, {
      data: {
        entryFeeCents: 1000,
        currency: "EUR"
      }
    });
    
    expect(activateResponse.ok()).toBeTruthy();
    const competition = await activateResponse.json();
    expect(competition.name).toBe(templateData.name);
    expect(competition.status).toBe("DRAFT");
    expect(competition.entryFeeCents).toBe(1000);

    // Test opening the competition
    const openResponse = await request.post(`http://localhost:4000/competitions/${competition.id}/open`);
    expect(openResponse.ok()).toBeTruthy();
    const openedCompetition = await openResponse.json();
    expect(openedCompetition.status).toBe("OPEN");
    
    console.log('API endpoints validation completed successfully!');
  });

  test('should handle expired template activation window', async ({ request }) => {
    // Create a template with activation window that has already closed
    const timestamp = Date.now();
    const templateData = {
      name: `Expired Template ${timestamp}`,
      gameType: "LMS", 
      sport: "EPL",
      status: "PUBLISHED",
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      activationOpenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      activationCloseAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      joinOpenAt: new Date().toISOString(),
      joinCloseAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      rulesJson: '{"noReuseTeam":true}'
    };

    const createResponse = await request.post('http://localhost:4000/templates', { data: templateData });
    expect(createResponse.ok()).toBeTruthy();
    const template = await createResponse.json();

    // Get Cavan GAA club ID
    const clubResponse = await request.get('http://localhost:4000/clubs/by-slug/cavan-gaa');
    const club = await clubResponse.json();

    // Try to activate expired template - should fail
    const activateResponse = await request.post(`http://localhost:4000/clubs/${club.id}/activate-template/${template.id}`, {
      data: {
        entryFeeCents: 1000,
        currency: "EUR"
      }
    });
    
    expect(activateResponse.status()).toBe(400);
    const errorData = await activateResponse.json();
    expect(errorData.error).toContain('Activation window is closed');
    
    console.log('Expired template API validation completed successfully!');
  });
});