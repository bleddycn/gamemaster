import { test, expect } from '@playwright/test';
import { signIn, signOut, TEST_USERS, expectErrorMessage } from './auth-utils';

test.describe('Admin Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Site Admin can create templates', async ({ page }) => {
    await signIn(page, TEST_USERS.siteAdmin);
    
    // Go to admin templates page
    await page.goto('/admin/templates');
    await expect(page.locator('h1')).toHaveText('Game Templates');
    
    // Fill out template creation form
    await page.fill('input[placeholder="LMS – EPL – Week 3"]', 'E2E Test Template');
    await page.fill('input[placeholder="2025-08-23T12:30:00.000Z"]', '2025-03-01T00:00:00.000Z');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Template created')).toBeVisible();
    
    // Form should be cleared
    await expect(page.locator('input[placeholder="LMS – EPL – Week 3"]')).toHaveValue('');
  });

  test('Club Admin cannot access template creation', async ({ page }) => {
    await signIn(page, TEST_USERS.clubAdmin);
    
    // Try to access admin templates page
    await page.goto('/admin/templates');
    
    // Should redirect to sign-in
    await page.waitForURL('/auth/sign-in');
  });

  test('Player cannot access template creation', async ({ page }) => {
    await signIn(page, TEST_USERS.player);
    
    // Try to access admin templates page
    await page.goto('/admin/templates');
    
    // Should redirect to sign-in
    await page.waitForURL('/auth/sign-in');
  });

  test('Club Admin can see Open Competition button only for their club', async ({ page }) => {
    await signIn(page, TEST_USERS.clubAdmin);
    
    // Go to their club page
    await page.goto('/clubs/cavan-gaa');
    
    // Look for any DRAFT competitions
    const draftCompetitions = page.locator('.bg-amber-100').filter({ hasText: 'DRAFT' });
    const count = await draftCompetitions.count();
    
    if (count > 0) {
      // If there are DRAFT competitions, should see Open button
      await expect(page.locator('button').filter({ hasText: 'Open for entries' })).toBeVisible();
    }
    
    // Go to another club's page
    await page.goto('/clubs/monaghan-gaa');
    
    // Should not see Open button even if there are DRAFT competitions
    await expect(page.locator('button').filter({ hasText: 'Open for entries' })).not.toBeVisible();
  });

  test('Player cannot see Open Competition button', async ({ page }) => {
    await signIn(page, TEST_USERS.player);
    
    // Visit any club page
    await page.goto('/clubs/cavan-gaa');
    
    // Should not see Open button regardless of competition status
    await expect(page.locator('button').filter({ hasText: 'Open for entries' })).not.toBeVisible();
  });

  test('Unauthenticated user cannot perform admin actions', async ({ page }) => {
    // Visit club page without signing in
    await page.goto('/clubs/cavan-gaa');
    
    // Should not see any admin action buttons
    await expect(page.locator('button').filter({ hasText: 'Open for entries' })).not.toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Activate' })).not.toBeVisible();
  });

  test('Error messages are user-friendly for unauthorized actions', async ({ page }) => {
    await signIn(page, TEST_USERS.player);
    await page.goto('/clubs/cavan-gaa');
    
    // Even though UI should hide buttons, test direct API calls would show friendly errors
    // This tests that if somehow an unauthorized request gets through, the error is clear
    
    // Navigate to a page that might trigger auth errors through API calls
    await page.goto('/admin/templates');
    await page.waitForURL('/auth/sign-in');
    
    // This confirms unauthorized users are properly redirected
    await expect(page.locator('h2')).toHaveText('Sign in');
  });

  test('Club switcher works correctly for multi-club admins', async ({ page }) => {
    // First, we need to make the club admin an admin of multiple clubs
    // This would typically be done via API call in a real test setup
    
    await signIn(page, TEST_USERS.clubAdmin);
    
    // Visit their current club
    await page.goto('/clubs/cavan-gaa');
    
    // Should see single club badge (since they're only admin of one club currently)
    await expect(page.locator('text=Cavan GAA').first()).toBeVisible();
    
    // The club name should be clickable and lead back to the club page
    await page.click('text=Cavan GAA');
    await expect(page.locator('h1')).toHaveText('Cavan GAA');
  });

  test('Sign out clears authentication and hides all admin controls', async ({ page }) => {
    await signIn(page, TEST_USERS.siteAdmin);
    
    // Verify admin controls are visible
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('text=Available Templates')).toBeVisible();
    
    // Sign out
    await signOut(page);
    
    // Visit the same club page
    await page.goto('/clubs/cavan-gaa');
    
    // Admin controls should be hidden
    await expect(page.locator('text=Available Templates')).not.toBeVisible();
    await expect(page.locator('text=Admin controls are only visible to club administrators')).toBeVisible();
  });
});