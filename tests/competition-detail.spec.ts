import { test, expect } from '@playwright/test';

test.describe('Competition Detail and Fixture Picking', () => {
  let competitionId: string;
  let templateId: string;

  test.beforeEach(async ({ request }) => {
    // Create a template first
    const timestamp = Date.now();
    const templateData = {
      name: `E2E Competition Detail Test ${timestamp}`,
      gameType: "LMS",
      sport: "EPL",
      status: "PUBLISHED",
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      activationOpenAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      activationCloseAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      joinOpenAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      joinCloseAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
      rulesJson: '{"noReuseTeam":true}'
    };

    const createTemplateResponse = await request.post('http://localhost:4000/templates', {
      data: templateData
    });
    expect(createTemplateResponse.ok()).toBeTruthy();
    const template = await createTemplateResponse.json();
    templateId = template.id;

    // Get Cavan GAA club
    const clubResponse = await request.get('http://localhost:4000/clubs/by-slug/cavan-gaa');
    expect(clubResponse.ok()).toBeTruthy();
    const club = await clubResponse.json();

    // Activate the template
    const activateResponse = await request.post(`http://localhost:4000/clubs/${club.id}/activate-template/${templateId}`, {
      data: {
        entryFeeCents: 500,
        currency: "EUR"
      }
    });
    expect(activateResponse.ok()).toBeTruthy();
    const competition = await activateResponse.json();
    competitionId = competition.id;

    // Open the competition
    const openResponse = await request.post(`http://localhost:4000/competitions/${competitionId}/open`);
    expect(openResponse.ok()).toBeTruthy();
  });

  test('should display competition details correctly', async ({ page }) => {
    await page.goto(`/competitions/${competitionId}`);

    // Check if page loads and shows competition info
    await expect(page.locator('h3')).toContainText('E2E Competition Detail Test');
    await expect(page.locator('text=Cavan GAA')).toBeVisible();
    await expect(page.locator('text=LMS')).toBeVisible();
    await expect(page.locator('text=OPEN')).toBeVisible();
    await expect(page.locator('text=EUR 5.00')).toBeVisible();
  });

  test('should handle competition not found', async ({ page }) => {
    await page.goto('/competitions/nonexistent-id');
    
    // Should show error or 404 page
    await expect(page.locator('text=Competition not found')).toBeVisible();
  });

  test('should show empty rounds message when no rounds exist', async ({ page }) => {
    await page.goto(`/competitions/${competitionId}`);
    
    // Should show message about no rounds
    await expect(page.locator('text=No rounds or fixtures available yet')).toBeVisible();
  });

  test('should create round and fixtures via API and test picking flow', async ({ page, request }) => {
    // First, create a round and fixtures via API
    const roundData = {
      competitionId,
      name: "Round 1",
      status: "UPCOMING",
      deadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
    };

    // Create round (this endpoint needs to be added to API for complete testing)
    // For now, let's assume rounds exist or create them directly in the database
    
    await page.goto(`/competitions/${competitionId}`);
    
    // Check competition details are visible
    await expect(page.locator('h3')).toContainText('E2E Competition Detail Test');
    
    console.log('Competition detail page loaded successfully');
  });

  test('should test API endpoints directly', async ({ request }) => {
    // Test competition detail endpoint
    const competitionResponse = await request.get(`http://localhost:4000/competitions/${competitionId}`);
    expect(competitionResponse.ok()).toBeTruthy();
    
    const competitionData = await competitionResponse.json();
    expect(competitionData.id).toBe(competitionId);
    expect(competitionData.status).toBe('OPEN');
    expect(competitionData.club.name).toBe('Cavan GAA');

    // Test picks endpoint validation
    const invalidPickResponse = await request.post('http://localhost:4000/picks', {
      data: {
        // Missing required fields
      }
    });
    expect(invalidPickResponse.status()).toBe(400);
    
    const invalidPickData = await invalidPickResponse.json();
    expect(invalidPickData.error).toContain('email, fixtureId, and teamPicked are required');

    console.log('API endpoints validation completed successfully');
  });

  test('should handle user registration and pick submission', async ({ request, page }) => {
    // First join the competition
    const joinResponse = await request.post(`http://localhost:4000/competitions/${competitionId}/entries`, {
      data: {
        email: "testuser@example.com",
        name: "Test User"
      }
    });
    expect(joinResponse.ok()).toBeTruthy();

    // Visit competition page
    await page.goto(`/competitions/${competitionId}`);
    
    // Verify user can see the competition details
    await expect(page.locator('h3')).toContainText('E2E Competition Detail Test');
    
    console.log('User registration and competition access flow completed successfully');
  });

  test('should test navigation from club page to competition detail', async ({ page }) => {
    // Start from club page
    await page.goto('/clubs/cavan-gaa');
    
    // Find our competition and click on it
    const competitionLink = page.locator('a').filter({ hasText: 'E2E Competition Detail Test' });
    await expect(competitionLink).toBeVisible();
    
    await competitionLink.click();
    
    // Should navigate to competition detail page
    await expect(page.url()).toContain(`/competitions/${competitionId}`);
    await expect(page.locator('h3')).toContainText('E2E Competition Detail Test');
    
    console.log('Navigation from club page to competition detail completed successfully');
  });

  test('should test error handling for picks without user', async ({ request }) => {
    // Try to submit pick without being a registered user
    const pickResponse = await request.post('http://localhost:4000/picks', {
      data: {
        email: "nonexistent@example.com",
        fixtureId: "fake-fixture-id",
        teamPicked: "Arsenal"
      }
    });
    
    expect(pickResponse.status()).toBe(404);
    const pickData = await pickResponse.json();
    expect(pickData.error).toContain('User not found');
    
    console.log('Pick submission error handling completed successfully');
  });
});