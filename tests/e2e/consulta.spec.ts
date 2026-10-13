import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';
test('consulta integrada mantém preço, aviso, teclado e rotação', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pecuária Inteligente' })).toBeVisible();
  await expect(page.getByText('Dados demonstrativos', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Consulta disponível', { timeout: 20000 });
  await expect(page.getByText(/R\$/).first()).toBeVisible();
  const button = page.getByRole('button', { name: 'Verificar atualizações' });
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Consulta disponível', { timeout: 20000 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByText('Dados demonstrativos', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
