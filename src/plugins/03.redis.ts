// import fp from 'fastify-plugin';
// import { type Redis } from 'ioredis';

// import { valkey, valkeyPub, valkeySub } from '@/config/redis.js';

// export default fp(
//   async (fastify) => {
//     await Promise.all([valkey.connect(), valkeyPub.connect(), valkeySub.connect()]);

//     fastify.log.info('Valkey ready');

//     fastify.decorate('valkey', valkey);
//     fastify.decorate('valkeyPub', valkeyPub);
//     fastify.decorate('valkeySub', valkeySub);

//     fastify.addHook('onClose', async () => {
//       await Promise.all([valkey.quit(), valkeyPub.quit(), valkeySub.quit()]);
//       fastify.log.info('Valkey disconnected');
//     });
//   },
//   {
//     name: 'valkey',
//     dependencies: ['config'],
//   },
// );

// declare module 'fastify' {
//   interface FastifyInstance {
//     valkey: Redis;
//     valkeyPub: Redis;
//     valkeySub: Redis;
//   }
// }
