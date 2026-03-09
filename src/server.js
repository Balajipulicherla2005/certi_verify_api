require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = parseInt(process.env.PORT) || 5001;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Certificate Verification API v1.0.0                  ║
╠══════════════════════════════════════════════════════════════╣
║  🚀  Running   → http://localhost:${PORT}                      ║
║  📋  API Base  → http://localhost:${PORT}/api                  ║
║  ❤️   Health   → http://localhost:${PORT}/health               ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    const shutdown = (signal) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      server.close(() => { console.log('✅ Server closed'); process.exit(0); });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('uncaughtException',  (err) => { console.error('❌ Uncaught Exception:', err); process.exit(1); });
    process.on('unhandledRejection', (reason) => { console.error('❌ Unhandled Rejection:', reason); process.exit(1); });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
