import { Lead } from './types';

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export async function saveLead(lead: Lead): Promise<void> {
  if (hasKV) {
    const { kv } = await import('@vercel/kv');
    const key = `lead:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    await kv.set(key, JSON.stringify(lead));
  } else {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'leads.json');
    let leads: Lead[] = [];
    try {
      leads = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch {}
    leads.push(lead);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(leads, null, 2));
  }
}

export async function getLeads(): Promise<Lead[]> {
  if (hasKV) {
    const { kv } = await import('@vercel/kv');
    const keys = await kv.keys('lead:*');
    if (!keys.length) return [];
    const values = await Promise.all(keys.map((k: string) => kv.get<string>(k)));
    return values
      .filter(Boolean)
      .map(v => { try { return JSON.parse(v as string); } catch { return null; } })
      .filter(Boolean) as Lead[];
  } else {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'leads.json');
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch {
      return [];
    }
  }
}
