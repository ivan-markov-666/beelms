import { validate } from 'class-validator';
import 'reflect-metadata';
import { Category } from '../../../packages/shared-types/src/entities/category.entity';

describe('Category Entity', () => {
  const createValidCategory = (): Category => {
    const c = new Category();
    c.name = 'Programming';
    c.description = 'Courses about software development';
    c.colorCode = '#1976d2';
    c.iconName = 'code';
    c.sortOrder = 1;
    c.isActive = true;
    return c;
  };

  it('validates a correct category', async () => {
    const cat = createValidCategory();
    const errors = await validate(cat);
    expect(errors.length).toBe(0);
  });

  it('detects invalid color code', async () => {
    const cat = createValidCategory();
    cat.colorCode = 'blue';
    const errors = await validate(cat);
    expect(errors.some((e) => e.property === 'colorCode')).toBe(true);
  });
});
