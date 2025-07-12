import express from 'express';
import { Request, Response, Application } from 'express';

const app: Application = express();
const port = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API root endpoint
app.get('/', (_req: Request, res: Response): void => {
  res.json({
    name: 'QA Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
  });
}

export default app;
