import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3001);

const app = await createApp();
await app.listen({ host: '0.0.0.0', port });
