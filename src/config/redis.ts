import { Redis } from 'ioredis';

import { env } from '@/config/env.js';

export function createClient(name: string): Redis {
  const client = new Redis(env.VALKEY_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on('connect', () => console.log(`Valkey/Redis [${name}] connected`));
  client.on('error', (err) => console.error(`Valkey/Redis [${name}] error`, err));

  return client;
}

export const valkey = createClient('main');
export const valkeyPub = createClient('pub');
export const valkeySub = createClient('sub');
