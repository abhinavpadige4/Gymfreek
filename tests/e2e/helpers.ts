import { expect, type Page } from '@playwright/test';

// Two-step signup shared by every spec: step 1 account, step 2 full
// training profile (mirrors the production form, so UI changes break here
// first, loudly).
export async function signUpUser(
  page: Page,
  { name, email, password }: { name: string; email: string; password: string },
): Promise<void> {
  await page.goto('/signup');
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();

  const pick = async (box: number, option: string) => {
    await page.getByRole('combobox').nth(box).click();
    const item = page.getByRole('option', { name: option, exact: true });
    await expect(item).toBeVisible();
    await item.click();
  };
  await pick(0, 'Male');
  await pick(1, 'Hypertrophy');
  await pick(2, 'Beginner');
  await page.getByLabel('Height (cm)', { exact: true }).fill('178');
  await page.getByLabel('Weight (kg)', { exact: true }).fill('75');
  await page.getByLabel('Training days / week', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Create account' }).click();
  // Seeding the catalog takes a few seconds server-side; allow headroom.
  await expect(page).toHaveURL('/', { timeout: 30000 });
}

// Profile payload every API-register call must include (registerSchema
// requires the training profile; health history stays optional).
export function registerProfile() {
  return {
    sex: 'MALE',
    heightCm: 178,
    bodyweight: 75,
    goal: 'HYPERTROPHY',
    weeklyFrequency: 3,
    experienceLevel: 'BEGINNER',
  };
}
