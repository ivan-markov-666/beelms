-- LMS Database Initialization Script
-- This script is executed when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE lms_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_dev');

SELECT 'CREATE DATABASE lms_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_test');

SELECT 'CREATE DATABASE lms_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_prod');

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create seeding user with limited privileges
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'seeder') THEN
        CREATE ROLE seeder LOGIN PASSWORD 'seeder123';
    END IF;
END $$;

-- Grant necessary permissions to seeder user
GRANT CONNECT ON DATABASE lms_dev TO seeder;
GRANT CONNECT ON DATABASE lms_test TO seeder;
GRANT CONNECT ON DATABASE lms_prod TO seeder;

-- Connect to each database and grant schema permissions
\c lms_dev
GRANT USAGE ON SCHEMA public TO seeder;
GRANT CREATE ON SCHEMA public TO seeder;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seeder;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seeder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO seeder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO seeder;

\c lms_test
GRANT USAGE ON SCHEMA public TO seeder;
GRANT CREATE ON SCHEMA public TO seeder;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seeder;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seeder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO seeder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO seeder;

\c lms_prod
GRANT USAGE ON SCHEMA public TO seeder;
GRANT CREATE ON SCHEMA public TO seeder;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seeder;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seeder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO seeder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO seeder;

-- Create logging table for seeding operations
\c lms_dev
CREATE TABLE IF NOT EXISTS seeding_log (
    id SERIAL PRIMARY KEY,
    operation VARCHAR(50) NOT NULL,
    entity VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\c lms_test
CREATE TABLE IF NOT EXISTS seeding_log (
    id SERIAL PRIMARY KEY,
    operation VARCHAR(50) NOT NULL,
    entity VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\c lms_prod
CREATE TABLE IF NOT EXISTS seeding_log (
    id SERIAL PRIMARY KEY,
    operation VARCHAR(50) NOT NULL,
    entity VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Switch back to default database
\c postgres
