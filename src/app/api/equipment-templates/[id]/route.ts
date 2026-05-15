import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import {
  serverRetireCanonicalTemplate,
  serverUpdateCanonicalTemplate,
} from '@/lib/db/server/equipmentTemplatesService';
import { UserType } from '@/types/user';

const REVIEWERS = new Set<UserType>([UserType.ADMIN, UserType.SYSTEM_MANAGER]);

/**
 * PATCH /api/equipment-templates/[id]
 *
 * Edit a canonical template. Bearer-gated; ADMIN / SYSTEM_MANAGER only.
 * Status changes are not allowed here — lifecycle transitions still go
 * through the propose / approve / reject endpoints.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const { id } = await params;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      if (!REVIEWERS.has(actor.userType)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden — admin / system_manager only' },
          { status: 403 }
        );
      }

      if (!id) {
        return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
      }

      const body = rawBody ? JSON.parse(rawBody) : {};
      if (!body || typeof body !== 'object' || !body.edits || typeof body.edits !== 'object') {
        return NextResponse.json(
          { success: false, error: 'edits object is required' },
          { status: 400 }
        );
      }

      await serverUpdateCanonicalTemplate({
        templateId: id,
        actorId: actor.uid,
        actorName: body.actorName || actor.displayName || actor.uid,
        edits: body.edits,
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] equipment-templates PATCH failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}

/**
 * DELETE /api/equipment-templates/[id]
 *
 * Soft-retire (isActive:false). Physical delete is not supported because
 * Equipment items reference template IDs directly.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const { id } = await params;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      if (!REVIEWERS.has(actor.userType)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden — admin / system_manager only' },
          { status: 403 }
        );
      }

      if (!id) {
        return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
      }

      let body: { actorName?: string; reason?: string } = {};
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          // empty body is fine
        }
      }

      await serverRetireCanonicalTemplate({
        templateId: id,
        actorId: actor.uid,
        actorName: body.actorName || actor.displayName || actor.uid,
        reason: body.reason,
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] equipment-templates DELETE failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
