import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { action, instanceId, testNumber, testMessage } = body;

    const instance = await base44.asServiceRole.entities.WhatsAppInstance.get(instanceId);
    if (!instance) return Response.json({ error: 'Instance not found' }, { status: 404 });

    const apiKey = secrets.get('EVOLUTION_API_KEY');
    if (!apiKey) return Response.json({ error: 'EVOLUTION_API_KEY não configurada. Defina a chave em Configurações.' }, { status: 500 });

    const server = String(instance.server_url).replace(/\/$/, '');
    const name = instance.instance_name;
    const headers = { 'Content-Type': 'application/json', apikey: apiKey };

    if (action === 'create') {
      const res = await fetch(`${server}/instance/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ instanceName: name, qrcode: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return Response.json({ error: data?.message || 'Erro na Evolution API' }, { status: 502 });
      const qrcode = data?.qrcode?.base64 || data?.qrcode || data?.base64 || null;
      await base44.asServiceRole.entities.WhatsAppInstance.update(instanceId, { status: 'connecting' });
      return Response.json({ qrcode, raw: data });
    }

    if (action === 'disconnect') {
      await fetch(`${server}/instance/logout?instanceName=${encodeURIComponent(name)}`, { method: 'DELETE', headers });
      await base44.asServiceRole.entities.WhatsAppInstance.update(instanceId, { status: 'disconnected' });
      return Response.json({ ok: true });
    }

    if (action === 'test') {
      if (!testNumber) return Response.json({ error: 'Informe um número para teste' }, { status: 400 });
      const res = await fetch(`${server}/message/sendText?instanceName=${encodeURIComponent(name)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ number: String(testNumber).replace(/\D/g, ''), text: testMessage || 'Teste Cronus CRM' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return Response.json({ error: data?.message || 'Falha no envio' }, { status: 502 });
      await base44.asServiceRole.entities.WhatsAppInstance.update(instanceId, { status: 'connected' });
      return Response.json({ ok: true, raw: data });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}