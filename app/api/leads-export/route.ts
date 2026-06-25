import { getLeads } from '../../../lib/storage';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('key') !== 'seagullboss') {
    return new Response('Unauthorised', { status: 401 });
  }

  const leads = await getLeads();
  const header = 'name,email,outcome_type,action,timestamp';
  const rows = leads.map(l =>
    [l.name, l.email ?? '', l.outcome_type, l.action ?? '', l.timestamp]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [header, ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="leads.csv"',
    },
  });
}
