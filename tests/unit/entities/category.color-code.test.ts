import { Category } from '../../../packages/shared-types/src/entities/category.entity';
import { validate } from 'class-validator';

describe('Category.colorCode validation', () => {
  const buildBase = (): Category => {
    const c = new Category();
    c.name = 'Category';
    return c;
  };

  it('accepts valid 6-digit hex', async () => {
    const c = buildBase();
    c.colorCode = '#1a2b3c';
    const errors = await validate(c);
    expect(errors.some((e) => e.property === 'colorCode')).toBe(false);
  });

  it('rejects invalid hex', async () => {
    const c = buildBase();
    c.colorCode = '#zzzzzz';
    const errors = await validate(c);
    expect(errors.some((e) => e.property === 'colorCode')).toBe(true);
  });

  it('rejects 3-digit shorthand', async () => {
    const c = buildBase();
    c.colorCode = '#123';
    const errors = await validate(c);
    expect(errors.some((e) => e.property === 'colorCode')).toBe(true);
  });
});
