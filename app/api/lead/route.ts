import { saveLead } from '../../../lib/storage';
import { Lead } from '../../../lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lead: Lead = {
      name: (body.name || 'Anonymous').trim(),
      email: body.email?.trim() || null,
      timestamp: new Date().toISOString(),
      outcome_type: body.outcome_type,
      action: body.action || null,
    };
    await saveLead(lead);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('Lead save error:', err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
