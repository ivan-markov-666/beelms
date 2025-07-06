import { DataSource } from 'typeorm'
import { Category } from '../../entities'
import { faker } from '@faker-js/faker'

/**
 * Seeds the `categories` table with example records.
 * The operation is idempotent – if categories already exist it skips seeding.
 */
export async function seedCategories(dataSource: DataSource): Promise<void> {
  const categoryRepo = dataSource.getRepository(Category)

  const existing = await categoryRepo.count()
  if (existing > 0) return

  const uniqueNames = new Set<string>()
  while (uniqueNames.size < 5) {
    uniqueNames.add(faker.commerce.department())
  }

  const categories: Category[] = Array.from(uniqueNames).map((name) => {
    const category = new Category()
    category.name = name
    return category
  })

  await categoryRepo.save(categories)
}
