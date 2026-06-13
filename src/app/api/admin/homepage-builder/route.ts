import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import fs from 'fs';
import path from 'path';

import { getDbFilePath } from '@/lib/dbPath';

export const dynamic = 'force-dynamic';

const DB_FILE = getDbFilePath();

function readRawDb() {
  if (!fs.existsSync(DB_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); }
  catch { return {}; }
}

function writeRawDb(data: any) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8'); }
  catch (e) { console.error('HomepageBuilder DB write error:', e); }
}

// GET — fetch saved builder state + all presets metadata
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const db = readRawDb();
  const { searchParams } = new URL(req.url);
  const exportFormat = searchParams.get('export');

  if (exportFormat === 'json') {
    const layout = {
      homeLayoutOrder: db.homeLayoutOrder || [],
      customSections: db.customSections || {},
      activePreset: db.activePreset || null,
      activeTheme: db.activeTheme || null,
    };
    return new NextResponse(JSON.stringify(layout, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="beato-homepage-layout.json"',
      }
    });
  }

  return NextResponse.json({
    success: true,
    homeLayoutOrder: db.homeLayoutOrder || [],
    customSections: db.customSections || {},
    activePreset: db.activePreset || null,
    activeTheme: db.activeTheme || null,
    savedTemplates: db.savedTemplates || [],
  });
}

// POST — save/publish layout, import layout, save as template
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await req.json();
    const db = readRawDb();

    if (body.action === 'publish') {
      // Publish full homepage layout
      db.homeLayoutOrder = body.homeLayoutOrder || db.homeLayoutOrder;
      db.customSections = body.customSections || db.customSections;
      db.activePreset = body.presetId || null;
      db.activeTheme = body.theme || null;
      writeRawDb(db);
      return NextResponse.json({ success: true, message: 'Homepage published successfully!' });
    }

    if (body.action === 'save_template') {
      // Save current builder state as a named template
      if (!db.savedTemplates) db.savedTemplates = [];
      const templateName = body.name || 'My Template';
      const existingIndex = db.savedTemplates.findIndex((t: any) => t.name === templateName);

      if (existingIndex !== -1) {
        // Update existing template
        db.savedTemplates[existingIndex] = {
          ...db.savedTemplates[existingIndex],
          homeLayoutOrder: body.homeLayoutOrder,
          customSections: body.customSections,
          presetId: body.presetId,
          theme: body.theme,
          updatedAt: new Date().toISOString()
        };
        writeRawDb(db);
        return NextResponse.json({ success: true, template: db.savedTemplates[existingIndex], isUpdate: true });
      } else {
        const template = {
          id: `tpl_${Date.now()}`,
          name: templateName,
          createdAt: new Date().toISOString(),
          homeLayoutOrder: body.homeLayoutOrder,
          customSections: body.customSections,
          presetId: body.presetId,
          theme: body.theme,
        };
        db.savedTemplates.push(template);
        writeRawDb(db);
        return NextResponse.json({ success: true, template, isUpdate: false });
      }
    }

    if (body.action === 'import') {
      // Import a layout JSON
      const layout = body.layout;
      if (!layout || !layout.homeLayoutOrder) {
        return NextResponse.json({ error: 'Invalid layout JSON' }, { status: 400 });
      }
      db.homeLayoutOrder = layout.homeLayoutOrder;
      db.customSections = layout.customSections || {};
      db.activePreset = layout.activePreset || null;
      db.activeTheme = layout.activeTheme || null;
      writeRawDb(db);
      return NextResponse.json({ success: true, message: 'Layout imported successfully!' });
    }

    if (body.action === 'delete_template') {
      db.savedTemplates = (db.savedTemplates || []).filter((t: any) => t.id !== body.templateId);
      writeRawDb(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    console.error('HomepageBuilder POST error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
