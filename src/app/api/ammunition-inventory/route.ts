import { NextResponse } from 'next/server';
import {
  serverUpsertAmmunitionStock,
  serverCreateSerialItem,
  validateUpsertStockInput,
  validateCreateSerialItemInput,
} from '@/lib/db/server/ammunitionInventoryService';
import {
  serverAssignFromCentral,
  serverReturnToCentral,
  serverBulkLoadCentralStock,
  validateAssignFromCentralInput,
  validateReturnToCentralInput,
} from '@/lib/db/server/ammunitionAssignService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();

    if (input.action === 'assign_from_central') {
      const payload = validateAssignFromCentralInput({ ...(input.payload || {}), actor });
      const result = await serverAssignFromCentral(payload);
      return NextResponse.json({ success: true, ...result });
    }

    if (input.action === 'return_to_central') {
      const payload = validateReturnToCentralInput({ ...(input.payload || {}), actor });
      const result = await serverReturnToCentral(payload);
      return NextResponse.json({ success: true, ...result });
    }

    if (input.action === 'central_bulk_load') {
      if (!Array.isArray(input.rows)) {
        return NextResponse.json(
          { success: false, error: 'rows must be an array' },
          { status: 400 }
        );
      }
      const result = await serverBulkLoadCentralStock(input.rows, actor);
      return NextResponse.json({ success: true, ...result });
    }

    if (input.kind === 'stock') {
      const payload = validateUpsertStockInput({ ...(input.payload || {}), actor });
      const result = await serverUpsertAmmunitionStock(payload);
      return NextResponse.json({ success: true, ...result });
    }

    if (input.kind === 'item') {
      const payload = validateCreateSerialItemInput({ ...(input.payload || {}), actor });
      const result = await serverCreateSerialItem(payload);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { success: false, error: 'kind must be stock or item, or use action=assign_from_central/return_to_central/central_bulk_load' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /forbidden/i.test(message) ? 403 : 500;
    console.error('[API] ammunition-inventory POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
