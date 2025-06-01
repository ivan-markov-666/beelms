# Test Service

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

Test Service is a microservice responsible for managing tests, questions, and test attempts in the online learning platform. It provides functionality for creating, retrieving, updating, and deleting tests and questions, as well as managing test attempts and results.

## Features

- **Test Management**: Create, read, update, and delete tests
- **Question Management**: Manage questions within tests
- **Test Attempts**: Track user test attempts and results
- **Scoring**: Calculate test scores based on user answers
- **Analytics**: Generate test statistics and analytics

## API Endpoints

### Tests
- `POST /tests` - Create a new test
- `GET /tests` - Get all tests
- `GET /tests/:id` - Get a test by ID
- `PATCH /tests/:id` - Update a test
- `DELETE /tests/:id` - Delete a test

### Questions
- `POST /questions` - Create a new question
- `GET /questions/:id` - Get a question by ID
- `PATCH /questions/:id` - Update a question
- `DELETE /questions/:id` - Delete a question

### Test Attempts
- `POST /attempts/start` - Start a new test attempt
- `POST /attempts/complete` - Complete a test attempt
- `GET /attempts/user/:userId` - Get user's test attempts
- `GET /attempts/:id` - Get a test attempt by ID

## Dependencies

- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull (for background jobs)
- **Search**: Elasticsearch (for full-text search)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- PostgreSQL (v12 or later)
- Redis (v6 or later)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and update the configuration:

```bash
cp .env.example .env
```

4. Update the `.env` file with your database and Redis connection details

### Running the Service

#### Development Mode

```bash
# Start in development mode with hot-reload
npm run start:dev
```

#### Production Mode

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```

## Testing

The test service includes a comprehensive test suite to ensure functionality and reliability.

### Running Tests

#### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

#### Integration Tests

Integration tests verify the interaction between different components and external services.

```bash
# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

### Test Data

Test data is located in the `test/data` directory. The following test data is available:

- `test-data/tests/` - Test test data
- `test-data/questions/` - Test question data
- `test-data/attempts/` - Test attempt data

### Test Reports

Test reports are generated in the `coverage` directory after running tests with coverage.

## API Documentation

API documentation is available when running the service in development mode at:

```
http://localhost:3000/api
```

## Deployment

### Docker

The service can be deployed using Docker:

```bash
# Build the Docker image
docker build -t test-service .

# Run the container
docker run -p 3000:3000 test-service
```

### Kubernetes

Kubernetes deployment files are located in the `k8s` directory.

## Monitoring

The service exposes the following endpoints for monitoring:

- `/health` - Health check
- `/metrics` - Prometheus metrics
- `/version` - Service version information

## Development

### Code Style

This project uses ESLint and Prettier for code formatting. Before committing, please run:

```bash
npm run lint
npm run format
```

### Git Hooks

Git hooks are set up using Husky. They will automatically run linting and tests before each commit.

### Commit Messages

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

## Troubleshooting

### Common Issues

#### Database Connection Issues

- Ensure PostgreSQL is running and accessible
- Verify database credentials in `.env`
- Check if the database exists and the user has proper permissions

#### Redis Connection Issues

- Ensure Redis server is running
- Verify Redis configuration in `.env`
- Check if Redis is accessible from the application

### Debugging

To enable debug logging, set the `DEBUG` environment variable:

```bash
DEBUG=test-service:* npm run start:dev
```

## API Reference

For detailed API documentation, please refer to the [API Reference](API.md).

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/yourusername/test-service/tags).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [NestJS](https://nestjs.com/) - The web framework used
- [TypeORM](https://typeorm.io/) - Database ORM
- [Redis](https://redis.io/) - In-memory data store
- [Bull](https://optimalbits.github.io/bull/) - Queue system
- [Elasticsearch](https://www.elastic.co/elasticsearch/) - Search and analytics engine
