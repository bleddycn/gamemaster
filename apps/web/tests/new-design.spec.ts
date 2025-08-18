import { test, expect } from '@playwright/test';

test.describe('New Design Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display new navigation sidebar', async ({ page }) => {
    // Check that navigation sidebar is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for logo in navigation
    await expect(page.locator('nav').locator('text=GameMaster')).toBeVisible();
    
    // Check for navigation items
    await expect(page.locator('nav').locator('text=Home')).toBeVisible();
    await expect(page.locator('nav').locator('text=Clubs')).toBeVisible();
  });

  test('should display new header with title', async ({ page }) => {
    // Check that main header is present
    await expect(page.locator('header')).toBeVisible();
    
    // Check that dashboard title is shown
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
  });

  test('should display new card-based layout', async ({ page }) => {
    // Check that cards are present on home page
    await expect(page.locator('[class*="bg-white"]').first()).toBeVisible();
    
    // Check for welcome card content
    await expect(page.locator('text=Welcome to GameMaster')).toBeVisible();
    await expect(page.locator('text=The ultimate sports competition platform')).toBeVisible();
  });

  test('should show sign in button when not authenticated', async ({ page }) => {
    // Check that sign in button is visible in navigation
    await expect(page.locator('nav').locator('text=Sign In')).toBeVisible();
  });

  test('should navigate to clubs page', async ({ page }) => {
    // Click clubs link in navigation
    await page.click('nav a[href="/clubs"]');
    
    // Check that we're on clubs page with new layout
    await expect(page.locator('h1').filter({ hasText: 'Clubs' })).toBeVisible();
    await expect(page.locator('text=Sports clubs and organizations')).toBeVisible();
  });

  test('should navigate to sign in page with logo', async ({ page }) => {
    // Click sign in button
    await page.click('nav a[href="/auth/sign-in"]');
    
    // Check that we're on sign in page
    await expect(page.locator('h2').filter({ hasText: 'Sign in' })).toBeVisible();
    
    // Check that logo is displayed
    await expect(page.locator('text=GameMaster')).toBeVisible();
  });

  test('should display clubs in table format', async ({ page }) => {
    // Navigate to clubs page
    await page.goto('/clubs');
    
    // Check for table structure
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Club Name' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
    
    // Check for club entries
    await expect(page.locator('text=Cavan GAA')).toBeVisible();
    await expect(page.locator('text=Monaghan GAA')).toBeVisible();
  });

  test('should display club detail page with new layout', async ({ page }) => {
    // Navigate to specific club
    await page.goto('/clubs/cavan-gaa');
    
    // Check for new header structure
    await expect(page.locator('h1').filter({ hasText: 'Cavan GAA' })).toBeVisible();
    
    // Check for competitions card
    await expect(page.locator('text=Competitions')).toBeVisible();
  });

  test('should display admin templates page with table', async ({ page }) => {
    // Navigate to admin templates (will test access later)
    await page.goto('/admin/templates');
    
    // Should redirect to sign in page (unauthenticated)
    await page.waitForURL('/auth/sign-in');
    await expect(page.locator('h2').filter({ hasText: 'Sign in' })).toBeVisible();
  });
});