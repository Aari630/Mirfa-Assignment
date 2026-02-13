import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';

export type TxSecureRecord = {
  id: string;
  partyId: string;
  createdAt: string;
  payload_nonce: string;
  payload_ct: string;
  payload_tag: string;
  dek_wrap_nonce: string;
  dek_wrapped: string;
  dek_wrap_tag: string;
  alg: 'AES-256-GCM';
  mk_version: 1;
};

const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const DEK_BYTES = 32;

function assertHex(value: string, label: string): Buffer {
  if (!/^[0-9a-fA-F]*$/.test(value) || value.length % 2 !== 0) {
    throw new Error(`${label} must be valid hex`);
  }
  return Buffer.from(value, 'hex');
}

function assertLength(value: Buffer, expected: number, label: string): void {
  if (value.length !== expected) {
    throw new Error(`${label} must be ${expected} bytes`);
  }
}

function aesGcmEncrypt(plaintext: Buffer, key: Buffer, nonce: Buffer): { ciphertext: Buffer; tag: Buffer } {
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext, tag };
}

function aesGcmDecrypt(ciphertext: Buffer, key: Buffer, nonce: Buffer, tag: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function parseMasterKeyHex(masterKeyHex: string): Buffer {
  const key = assertHex(masterKeyHex, 'master key');
  assertLength(key, DEK_BYTES, 'master key');
  return key;
}

export function encryptTransaction(input: {
  partyId: string;
  payload: Record<string, unknown>;
  masterKeyHex: string;
}): TxSecureRecord {
  const masterKey = parseMasterKeyHex(input.masterKeyHex);
  const dek = randomBytes(DEK_BYTES);
  const payloadNonce = randomBytes(NONCE_BYTES);
  const wrapNonce = randomBytes(NONCE_BYTES);

  const payloadBuffer = Buffer.from(JSON.stringify(input.payload), 'utf8');
  const payloadEnc = aesGcmEncrypt(payloadBuffer, dek, payloadNonce);
  const wrapEnc = aesGcmEncrypt(dek, masterKey, wrapNonce);

  return {
    id: randomUUID(),
    partyId: input.partyId,
    createdAt: new Date().toISOString(),
    payload_nonce: payloadNonce.toString('hex'),
    payload_ct: payloadEnc.ciphertext.toString('hex'),
    payload_tag: payloadEnc.tag.toString('hex'),
    dek_wrap_nonce: wrapNonce.toString('hex'),
    dek_wrapped: wrapEnc.ciphertext.toString('hex'),
    dek_wrap_tag: wrapEnc.tag.toString('hex'),
    alg: 'AES-256-GCM',
    mk_version: 1
  };
}

export function decryptTransaction(record: TxSecureRecord, masterKeyHex: string): Record<string, unknown> {
  const masterKey = parseMasterKeyHex(masterKeyHex);

  const payloadNonce = assertHex(record.payload_nonce, 'payload_nonce');
  const payloadCiphertext = assertHex(record.payload_ct, 'payload_ct');
  const payloadTag = assertHex(record.payload_tag, 'payload_tag');
  const wrapNonce = assertHex(record.dek_wrap_nonce, 'dek_wrap_nonce');
  const wrappedDek = assertHex(record.dek_wrapped, 'dek_wrapped');
  const wrapTag = assertHex(record.dek_wrap_tag, 'dek_wrap_tag');

  assertLength(payloadNonce, NONCE_BYTES, 'payload_nonce');
  assertLength(payloadTag, TAG_BYTES, 'payload_tag');
  assertLength(wrapNonce, NONCE_BYTES, 'dek_wrap_nonce');
  assertLength(wrapTag, TAG_BYTES, 'dek_wrap_tag');

  let dek: Buffer;
  try {
    dek = aesGcmDecrypt(wrappedDek, masterKey, wrapNonce, wrapTag);
  } catch {
    throw new Error('DEK unwrap failed');
  }

  let plaintext: Buffer;
  try {
    plaintext = aesGcmDecrypt(payloadCiphertext, dek, payloadNonce, payloadTag);
  } catch {
    throw new Error('Payload decryption failed');
  }

  try {
    return JSON.parse(plaintext.toString('utf8')) as Record<string, unknown>;
  } catch {
    throw new Error('Decrypted payload is not valid JSON');
  }
}
