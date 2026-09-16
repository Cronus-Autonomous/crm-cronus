import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expected = secrets.get('INBOUND_WEBHOOK_TOKEN');
    if (!expected || token !== expected) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const stages = await base44.asServiceRole.entities.Stage.list('order', 100);
    const firstStage = (stages || [])[0];
    if (!firstStage) return Response.json({ error: 'No stage configured' }, { status: 500 });

    const users = await base44.asServiceRole.entities.User.list();
    const admin = (users || []).find((u) => u.role === 'admin') || (users || [])[0];

    const payload = {
      company_name: body.company_name || body.company || 'Lead sem nome',
      phone: body.phone || '',
      email: body.email || '',
      site_url: body.site_url || body.url || '',
      has_site: !!(body.has_site ?? (!!body.site_url)),
      temperature: body.temperature || 'frio',
      value: Number(body.value || 0),
      status: 'open',
      stage_id: firstStage.id,
      owner_id: admin?.id || '',
      notes: body.notes || '',
      last_fup_date: new Date().toISOString(),
    };

    const created = await base44.asServiceRole.entities.Opportunity.create(payload);
    return Response.json({ ok: true, id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}