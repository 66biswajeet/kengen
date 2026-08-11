'use strict';
/**
 * AquaServe — server entry point.
 * Connects to MongoDB, seeds data, and starts the HTTP server.
 */
const { connectDb, closeDb } = require('./db/connection');
const { seedData } = require('./db/seed');
const app = require('./app');
const { PORT } = require('./config');

async function main() {
  try {
    // 1. Connect to MongoDB and create indexes
    await connectDb();

    // 2. Seed initial data (idempotent)
    await seedData();

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 AquaServe API running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/`);
      console.log(`   API base:     http://localhost:${PORT}/api/v1\n`);
    });

    // 4. Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}, shutting down...`);
      server.close(async () => {
        await closeDb();
        console.log('[Server] Graceful shutdown complete.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('[Server] Startup error:', err);
    process.exit(1);
  }
}

main();
