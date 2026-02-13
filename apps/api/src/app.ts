import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { decryptTransaction, encryptTransaction } from '@mirfa/crypto';
import { requireMasterKeyHex } from './config.js';
import { txStore } from './store.js';

const EncryptBodySchema = z.object({
  partyId: z.string().min(1),
  payload: z.record(z.unknown())
});

const IdParamsSchema = z.object({
  id: z.string().uuid()
});

export async function createApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ ok: true }));

  app.post('/tx/encrypt', async (request, reply) => {
    const parsed = EncryptBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', issues: parsed.error.issues });
    }

    try {
      const record = encryptTransaction({
        partyId: parsed.data.partyId,
        payload: parsed.data.payload,
        masterKeyHex: requireMasterKeyHex()
      });
      txStore.set(record.id, record);
      return reply.status(201).send(record);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Encryption failed';
      return reply.status(400).send({ error: message });
    }
  });

  app.get('/tx/:id', async (request, reply) => {
    const parsed = IdParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid transaction id' });
    }

    const record = txStore.get(parsed.data.id);
    if (!record) {
      return reply.status(404).send({ error: 'Transaction not found' });
    }

    return reply.send(record);
  });

  app.post('/tx/:id/decrypt', async (request, reply) => {
    const parsed = IdParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid transaction id' });
    }

    const record = txStore.get(parsed.data.id);
    if (!record) {
      return reply.status(404).send({ error: 'Transaction not found' });
    }

    try {
      const payload = decryptTransaction(record, requireMasterKeyHex());
      return reply.send({ id: record.id, partyId: record.partyId, payload });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Decryption failed';
      return reply.status(400).send({ error: message });
    }
  });

  return app;
}
