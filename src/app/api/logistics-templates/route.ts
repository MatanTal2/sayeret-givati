import { NextResponse } from 'next/server';
import {
  serverCreateLogisticsTemplate,
  serverUpdateLogisticsTemplate,
  serverDeactivateLogisticsTemplate,
  validateLogisticsTemplateInput,
} from '@/lib/db/server/logisticsTemplatesService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import { UserType } from '@/types/user';

function requireManager(userType: UserType): NextResponse | null {
  const ok =
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER;
  if (ok) return null;
  return NextResponse.json(
    { success: false, error: 'Forbidden: only admin/manager may modify logistics templates' },
    { status: 403 }
  );
}

export async function POST(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const forbidden = requireManager(actor.userType);
      if (forbidden) return forbidden;
      const body = rawBody ? JSON.parse(rawBody) : {};
      const input = validateLogisticsTemplateInput({ ...body, createdBy: actor.uid });
      const id = await serverCreateLogisticsTemplate(input);
      return NextResponse.json({ success: true, id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] logistics-templates POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  });
}

export async function PUT(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const forbidden = requireManager(actor.userType);
      if (forbidden) return forbidden;
      const { id, ...updates } = rawBody ? JSON.parse(rawBody) : {};
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ success: false, error: 'Template id is required' }, { status: 400 });
      }
      await serverUpdateLogisticsTemplate(id, updates);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] logistics-templates PUT failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  });
}

export async function DELETE(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const forbidden = requireManager(actor.userType);
      if (forbidden) return forbidden;
      const { id } = rawBody ? JSON.parse(rawBody) : {};
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ success: false, error: 'Template id is required' }, { status: 400 });
      }
      await serverDeactivateLogisticsTemplate(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] logistics-templates DELETE failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
