import { NextResponse } from 'next/server';
import {
  serverCreateSubcategory,
  serverUpdateSubcategory,
  serverDeactivateSubcategory,
} from '@/lib/db/server/categoriesService';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name || !data.parentCategoryId) {
      return NextResponse.json(
        { success: false, error: 'Subcategory name and parentCategoryId are required' },
        { status: 400 }
      );
    }
    const id = await serverCreateSubcategory(data);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] subcategories POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Subcategory id is required' }, { status: 400 });
    }
    await serverUpdateSubcategory(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] subcategories PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Subcategory id is required' }, { status: 400 });
    }
    await serverDeactivateSubcategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] subcategories DELETE failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
