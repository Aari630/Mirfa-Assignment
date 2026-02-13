import { createApp } from '../src/app.js';

let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  await app.ready();
  app.server.emit('request', req, res);
}
