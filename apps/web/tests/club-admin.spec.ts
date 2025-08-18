import { test, expect } from '@playwright/test';
import { signIn, signOut, TEST_USERS, expectErrorMessage } from './auth-utils';

test.describe('Club Admin Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Site Admin can access any club admin controls', async ({ page }) => {
    await signIn(page, TEST_USERS.siteAdmin);
    
    // Visit Cavan GAA club page
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('h1')).toHaveText('Cavan GAA');
    
    // Should see admin controls (template activation)
    await expect(page.locator('h2').filter({ hasText: 'Available Templates' })).toBeVisible();
    
    // Should not see the "not an admin" banner
    await expect(page.locator('text=not an admin of this club')).not.toBeVisible();
    
    // Should be able to see template activation area
    await expect(page.locator('text=Available Templates')).toBeVisible();
  });

  test('Club Admin can access their own club controls', async ({ page }) => {
    await signIn(page, TEST_USERS.clubAdmin);
    
    // Visit Cavan GAA club page (their club)
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('h1')).toHaveText('Cavan GAA');
    
    // Should see admin controls
    await expect(page.locator('text=Available Templates')).toBeVisible();
    
    // Should not see the "not an admin" banner
    await expect(page.locator('text=not an admin of this club')).not.toBeVisible();
  });

  test('Club Admin cannot access other clubs admin controls', async ({ page }) => {
    await signIn(page, TEST_USERS.clubAdmin);
    
    // Visit Monaghan GAA club page (not their club)
    await page.goto('/clubs/monaghan-gaa');
    await expect(page.locator('h1')).toHaveText('Monaghan GAA');
    
    // Should see the "not an admin" banner
    await expect(page.locator('text=not an admin of this club')).toBeVisible();
    
    // Should not see template activation
    await expect(page.locator('text=Available Templates')).not.toBeVisible();
    
    // Should see placeholder admin controls area
    await expect(page.locator('text=Admin controls are only visible to club administrators')).toBeVisible();
  });

  test('Player cannot access any club admin controls', async ({ page }) => {
    await signIn(page, TEST_USERS.player);
    
    // Visit Cavan GAA club page
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('h1')).toHaveText('Cavan GAA');
    
    // Should see the "not an admin" banner
    await expect(page.locator('text=not an admin of this club')).toBeVisible();
    
    // Should not see template activation
    await expect(page.locator('text=Available Templates')).not.toBeVisible();
    
    // Should see placeholder admin controls area
    await expect(page.locator('text=Admin controls are only visible to club administrators')).toBeVisible();
  });

  test('Unauthenticated user cannot access admin controls', async ({ page }) => {
    // Visit club page without signing in
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('h1')).toHaveText('Cavan GAA');
    
    // Should not see template activation
    await expect(page.locator('text=Available Templates')).not.toBeVisible();
    
    // Should see placeholder with sign-in link
    await expect(page.locator('text=Admin controls are only visible to club administrators')).toBeVisible();
    await expect(page.locator('text=Sign in to access admin features')).toBeVisible();
  });

  test('Club competitions list is always visible to everyone', async ({ page }) => {
    // Check as unauthenticated user
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('h2').filter({ hasText: 'Competitions' })).toBeVisible();
    
    // Check as player
    await signIn(page, TEST_USERS.player);
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('h2').filter({ hasText: 'Competitions' })).toBeVisible();
    
    // Check as club admin
    await signOut(page);
    await signIn(page, TEST_USERS.clubAdmin);
    await page.goto('/clubs/cavan-gaa');
    await expect(page.locator('h2').filter({ hasText: 'Competitions' })).toBeVisible();
  });
});