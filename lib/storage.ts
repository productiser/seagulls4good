import { Lead } from './types';

const url = process.env.seagulls4good_KV_REST_API_URL;
const token = process.env.seagulls4good_KV_REST_API_TOKEN;
const hasRedis = !!(url && token);

async function getRedis() {
  const { Redis } = await import('@upstash/redis');
  return new Redis({ url: url!, token: token! });
}

export async function saveLead(lead: Lead): Promise<void> {
  if (hasRedis) {
    const redis = await getRedis();
    await redis.lpush('leads', JSON.stringify(lead));
  } else {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'leads.json');
    let leads: Lead[] = [];
    try { leads = JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch {}
    leads.push(lead);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(leads, null, 2));
  }
}

export async function getLeads(): Promise<Lead[]> {
  if (hasRedis) {
    const redis = await getRedis();
    const items = await redis.lrange<string>('leads', 0, -1);
    return items
      .map(v => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return null; } })
      .filter(Boolean) as Lead[];
  } else {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'leads.json');
    try { return JSON.parse(await fs.readFile(filePath, 'utf-8')); } catch { return []; }
  }
}
