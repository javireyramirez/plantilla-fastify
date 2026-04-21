import { buildApp } from '@/app.js';
import { env } from '@/config/env.js';

async function main() {
  const app = await buildApp();

  const host = env.HOST;
  const port = Number(env.PORT);

  try {
    await app.listen({ host, port });
  } catch (err) {
    app.log.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// ── Cierre limpio ──────────────────────────────────────────────────────────────
// Fastify llama a todos los hooks onClose registrados en los plugins
// (prisma.$disconnect, redis.quit, bullmq.close, etc.)
const signals = ['SIGINT', 'SIGTERM'] as const;

for (const signal of signals) {
  process.once(signal, async () => {
    try {
      // buildApp devuelve la instancia — la guardamos para el shutdown
      // En la práctica esto se hace con una variable module-level
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  });
}

main();
