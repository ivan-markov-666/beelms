import { DataSource } from 'typeorm'
import { seedCategories } from './category.seeder'
import { seedUsers } from './user.seeder'

/**
 * Runs all registered seeders in a deterministic order.
 */
export async function seedDatabase(dataSource: DataSource): Promise<void> {
  await seedCategories(dataSource)
  await seedUsers(dataSource)
}
