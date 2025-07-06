import 'reflect-metadata'
import { AppDataSource } from './data-source'
import { seedDatabase } from './database/seeders'

/**
 * Runs a CLI command. If `command` е undefined (обикновено при директно извикване
 * от терминал), командата се взима от `process.argv[2]`.
 */
export async function run(command?: string): Promise<void> {
  const cmd = command ?? process.argv[2]

  if (!cmd) {
    console.error('No command supplied. Usage: run cli -- <command>')
    process.exit(1)
  }

  switch (cmd) {
    case 'db:seed': {
      await AppDataSource.initialize()
      await seedDatabase(AppDataSource)
      console.log('Seeding completed successfully.')
      await AppDataSource.destroy()
      break
    }

    default: {
      console.error(`Unknown command "${cmd}"`)
      process.exit(1)
    }
  }
}

// Execute automatically when the file is run via `node src/cli.js <command>`
if (require.main === module) {
  run().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
