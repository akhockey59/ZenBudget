
import { AppState } from '../types';

export const fetchRemoteData = async (url: string, apiKey?: string): Promise<Partial<AppState> | null> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetch(`${url}/api/data`, { headers });
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.error("API Fetch Error:", e);
    return null;
  }
};

export const pushRemoteData = async (url: string, data: AppState, apiKey?: string): Promise<boolean> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetch(`${url}/api/data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data }),
    });
    return res.ok;
  } catch (e) {
    console.error("API Push Error:", e);
    return false;
  }
};
