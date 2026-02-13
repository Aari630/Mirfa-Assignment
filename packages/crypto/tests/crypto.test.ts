import { describe, expect, it } from 'vitest';
import { decryptTransaction, encryptTransaction } from '../src/index.js';

const masterKeyHex = '11'.repeat(32);

describe('envelope encryption', () => {
  it('encrypt then decrypt returns original payload', () => {
    const payload = { amount: 100, currency: 'AED' };
    const record = encryptTransaction({ partyId: 'party_123', payload, masterKeyHex });
    const result = decryptTransaction(record, masterKeyHex);
    expect(result).toEqual(payload);
  });

  it('fails when payload ciphertext is tampered', () => {
    const record = encryptTransaction({
      partyId: 'party_123',
      payload: { amount: 100 },
      masterKeyHex
    });
    record.payload_ct = record.payload_ct.slice(0, -2) + (record.payload_ct.endsWith('00') ? '01' : '00');
    expect(() => decryptTransaction(record, masterKeyHex)).toThrow(/decryption failed/i);
  });

  it('fails when payload tag is tampered', () => {
    const record = encryptTransaction({
      partyId: 'party_123',
      payload: { amount: 100 },
      masterKeyHex
    });
    record.payload_tag = record.payload_tag.slice(0, -2) + (record.payload_tag.endsWith('00') ? '01' : '00');
    expect(() => decryptTransaction(record, masterKeyHex)).toThrow(/decryption failed/i);
  });

  it('fails when nonce length is invalid', () => {
    const record = encryptTransaction({
      partyId: 'party_123',
      payload: { amount: 100 },
      masterKeyHex
    });
    record.payload_nonce = record.payload_nonce.slice(2);
    expect(() => decryptTransaction(record, masterKeyHex)).toThrow(/12 bytes/i);
  });

  it('fails on invalid hex', () => {
    const record = encryptTransaction({
      partyId: 'party_123',
      payload: { amount: 100 },
      masterKeyHex
    });
    record.dek_wrapped = 'zz';
    expect(() => decryptTransaction(record, masterKeyHex)).toThrow(/valid hex/i);
  });
});
