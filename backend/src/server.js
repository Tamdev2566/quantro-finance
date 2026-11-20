import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import apiRouter from './routes/api.js';
import jsonStore from './storage/jsonStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.join(__dirname, '../../frontend/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user']
}));

// Parse JSON bodies with a 10MB limit for bulk import
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: jsonStore.version
  });
});

// API Routes
app.use('/api', apiRouter);

// Serve Frontend static assets in production
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(err.status || 400).json({
    success: false,
    message: err.message || 'Internal Financial Engine Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Apex Finance & Accounting Server Running`);
    console.log(`  Port: http://localhost:${PORT}`);
    console.log(`  Healthcheck: http://localhost:${PORT}/health`);
    console.log(`  API Base: http://localhost:${PORT}/api`);
    console.log(`  Storage: backend/finance/storage (JSON file-based)`);
    console.log(`=======================================================`);
  });
}

export default app;
