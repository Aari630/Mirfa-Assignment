'use client';

import { useMemo, useState } from 'react';

type AnyObject = Record<string, unknown>;

export default function Page() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001', []);

  const [partyId, setPartyId] = useState('party_123');
  const [payloadText, setPayloadText] = useState('{\n  "amount": 100,\n  "currency": "AED"\n}');
  const [txId, setTxId] = useState('');
  const [encryptedResult, setEncryptedResult] = useState<unknown>(null);
  const [fetchedResult, setFetchedResult] = useState<unknown>(null);
  const [decryptedResult, setDecryptedResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function encryptAndSave() {
    setError(null);
    setLoading(true);
    try {
      const payload = JSON.parse(payloadText) as AnyObject;
      const response = await fetch(`${apiUrl}/tx/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyId, payload })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Encrypt request failed');
      }
      setEncryptedResult(data);
      setTxId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEncrypted() {
    setError(null);
    if (!txId) {
      setError('Transaction id is required');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/tx/${txId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Fetch request failed');
      }
      setFetchedResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  async function decrypt() {
    setError(null);
    if (!txId) {
      setError('Transaction id is required');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/tx/${txId}/decrypt`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Decrypt request failed');
      }
      setDecryptedResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Secure Transactions Mini-App</h1>

      <label>
        Party ID
        <input value={partyId} onChange={(event) => setPartyId(event.target.value)} />
      </label>

      <label>
        JSON Payload
        <textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} rows={10} />
      </label>

      <label>
        Transaction ID
        <input value={txId} onChange={(event) => setTxId(event.target.value)} placeholder="UUID" />
      </label>

      <div className="actions">
        <button onClick={encryptAndSave} disabled={loading}>
          Encrypt &amp; Save
        </button>
        <button onClick={fetchEncrypted} disabled={loading}>
          Fetch
        </button>
        <button onClick={decrypt} disabled={loading}>
          Decrypt
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Encrypted Record (POST /tx/encrypt)</h2>
        <pre>{encryptedResult ? JSON.stringify(encryptedResult, null, 2) : '-'}</pre>
      </section>

      <section>
        <h2>Fetched Encrypted Record (GET /tx/:id)</h2>
        <pre>{fetchedResult ? JSON.stringify(fetchedResult, null, 2) : '-'}</pre>
      </section>

      <section>
        <h2>Decrypted Payload (POST /tx/:id/decrypt)</h2>
        <pre>{decryptedResult ? JSON.stringify(decryptedResult, null, 2) : '-'}</pre>
      </section>
    </main>
  );
}
