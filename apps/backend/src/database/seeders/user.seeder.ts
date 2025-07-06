import { DataSource } from 'typeorm'
import { User, UserRole } from '../../entities'
import { faker } from '@faker-js/faker'

/**
 * Seeds the `users` table with an admin account and several regular users.
 * Default credentials for the admin are `admin@example.com` / `admin` – make
 * sure to change them in production.
 */
export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User)

  const existing = await userRepo.count()
  if (existing > 0) return

  // Admin user
  const admin = new User()
  admin.email = 'admin@example.com'
  admin.password = 'admin' // REPLACE WITH A HASHED PASSWORD IN PRODUCTION
  admin.role = UserRole.ADMIN

  // Fake regular users (for local development/testing convenience)
  const regularUsers: User[] = Array.from({ length: 10 }).map(() => {
    const user = new User()
    user.email = faker.internet.email().toLowerCase()
    user.password = 'password'
    user.role = UserRole.USER
    return user
  })

  await userRepo.save([admin, ...regularUsers])
}
