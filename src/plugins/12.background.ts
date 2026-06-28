import fp from 'fastify-plugin';

export default fp(
  async (fastify) => {
    // Run cleanup on startup (deferred to not block server boot)
    setImmediate(async () => {
      try {
        fastify.log.info('Running startup trash cleanup...');
        const result = await fastify.trashService.emptyExpiredTrash();
        fastify.log.info({ count: result.count }, 'Startup trash cleanup completed');
      } catch (error) {
        fastify.log.error(error, 'Error running startup trash cleanup');
      }
    });

    // Run daily cleanup (every 24 hours)
    const DAILY_MS = 24 * 60 * 60 * 1000;
    const interval = setInterval(async () => {
      try {
        fastify.log.info('Running daily trash cleanup job...');
        const result = await fastify.trashService.emptyExpiredTrash();
        fastify.log.info({ count: result.count }, 'Daily trash cleanup job completed');
      } catch (error) {
        fastify.log.error(error, 'Error running daily trash cleanup job');
      }
    }, DAILY_MS);

    // Clean up timer on server close
    fastify.addHook('onClose', async () => {
      clearInterval(interval);
    });
  },
  {
    name: 'background-jobs',
    dependencies: ['services'],
  },
);
