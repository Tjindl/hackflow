import type { Answers } from './questions';

const endpoint: string | undefined = import.meta.env.VITE_SUBMIT_URL;
const TIMEOUT_MS = 15_000;

/** POSTs the answers as JSON to `VITE_SUBMIT_URL`. Without one configured, they are only logged. */
export async function submitRegistration(answers: Answers): Promise<void> {
  if (!endpoint) {
    console.info('[hackflow] VITE_SUBMIT_URL is not set; registration not sent.', answers);
    return;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...answers, submittedAt: new Date().toISOString() }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`The server responded with ${response.status}.`);
}
