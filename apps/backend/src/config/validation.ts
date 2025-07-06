import * as Joi from 'joi'

/**
 * Validation schema for environment variables.
 * If a required variable is missing or invalid, the Nest application will fail fast on startup.
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production', 'staging')
    .default('development'),

  DATABASE_URL: Joi.string().uri().required(),
  PORT: Joi.number().port().default(3000),

  // Comma-separated list of allowed origins for CORS (e.g. http://localhost:3000,http://localhost:4200)
  CORS_ORIGIN: Joi.string().optional(),
})
