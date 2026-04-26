import { NextResponse } from 'next/server';
import {
  serverSubmitAmmunitionReport,
  serverListAmmunitionReports,
  validateSubmitReportInput,
} from '@/lib/db/server/ammunitionReportsService';
import { validateActor } from '@/lib/db/server/policyHelpers';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fromMs = url.searchParams.get('fromMs');
    const toMs = url.searchParams.get('toMs');
    const teamId = url.searchParams.get('teamId') || undefined;
    const reporterId = url.searchParams.get('reporterId') || undefined;
    const templateId = url.searchParams.get('templateId') || undefined;
    const limit = url.searchParams.get('limit');

    const reports = await serverListAmmunitionReports({
      ...(fromMs ? { fromMs: Number(fromMs) } : {}),
      ...(toMs ? { toMs: Number(toMs) } : {}),
      ...(teamId ? { teamId } : {}),
      ...(reporterId ? { reporterId } : {}),
      ...(templateId ? { templateId } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
    });
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] ammunition-reports GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const actor = validateActor(input.actor);
    const payload = validateSubmitReportInput({ ...(input.payload || {}), actor });
    const result = await serverSubmitAmmunitionReport(payload);
    return NextResponse.json({
      success: true,
      reportId: result.reportId,
      notifiedCount: result.notificationRecipientIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /forbidden/i.test(message) ? 403 : 500;
    console.error('[API] ammunition-reports POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
