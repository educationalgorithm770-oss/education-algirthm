import { test, expect } from '@playwright/test';

test.describe('Complete Website Audit & E2E Test Suite', () => {

  // 1. PUBLIC MARKETING PAGES
  test('1. Homepage (/)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Education Algorithm/i);
    await expect(page.locator('h1')).toContainText(/Master Software Engineering/i);
  });

  test('2. Public Courses Catalog (/courses)', async ({ page }) => {
    await page.goto('/courses');
    await expect(page.locator('h1')).toContainText(/Engineering Cohorts/i);
  });

  test('3. Career Outcomes (/outcomes)', async ({ page }) => {
    await page.goto('/outcomes');
    await expect(page.locator('h1')).toContainText(/Proven Engineering Career Outcomes/i);
  });

  test('4. Admissions Contact Desk (/contact)', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText(/Talk to Senior Faculty/i);
  });

  test('5. About Us & Pedagogy (/about)', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toContainText(/Our Mission & Learning Model/i);
  });

  // 2. STUDENT PORTAL
  test('6. Student Login (/login)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form input[type="email"]')).toBeVisible();
    await expect(page.locator('form input[type="password"]')).toBeVisible();
  });

  test('7. Student Register (/register)', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('form input[type="email"]')).toBeVisible();
  });

  test('8. Code Arena IDE Studio (/code-arena)', async ({ page }) => {
    await page.goto('/code-arena');
    await expect(page.locator('h1')).toContainText(/Two Sum Algorithm/i);
  });

  test('9. AI Technical Tutor (/ai-tutor)', async ({ page }) => {
    await page.goto('/ai-tutor');
    await expect(page.locator('body')).toBeVisible();
  });

  test('10. Certificate Verification (/verify-certificate)', async ({ page }) => {
    await page.goto('/verify-certificate');
    await expect(page.locator('body')).toBeVisible();
  });

  test('11. Real-World Capstones Guard (/dashboard/projects)', async ({ page }) => {
    await page.goto('/dashboard/projects');
    await expect(page).toHaveURL(/.*login/);
  });

  test('12. AI Mock Interview Arena Guard (/dashboard/ai-interview)', async ({ page }) => {
    await page.goto('/dashboard/ai-interview');
    await expect(page).toHaveURL(/.*login/);
  });

  test('13. AI Resume Builder Guard (/dashboard/ai-resume)', async ({ page }) => {
    await page.goto('/dashboard/ai-resume');
    await expect(page).toHaveURL(/.*login/);
  });

  test('14. FAANG Question Bank Guard (/dashboard/question-bank)', async ({ page }) => {
    await page.goto('/dashboard/question-bank');
    await expect(page).toHaveURL(/.*login/);
  });

  test('15. Live Tech Job Board Guard (/dashboard/jobs)', async ({ page }) => {
    await page.goto('/dashboard/jobs');
    await expect(page).toHaveURL(/.*login/);
  });

  // 3. ADMIN CONSOLE
  test('16. Admin Console Login (/admin/login)', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('17. Admin Capstones Manager Guard (/admin/projects)', async ({ page }) => {
    await page.goto('/admin/projects');
    await expect(page).toHaveURL(/.*admin\/login/);
  });

});
