import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import fs from 'fs';
import path from 'path';

// Maps MIME type to subfolder
const TYPE_MAP: Record<string, string> = {
  'image/': 'ads/images',
  'audio/': 'ads/audio',
  'video/': 'ads/video',
};

function getSubfolder(mimeType: string): string {
  for (const [prefix, folder] of Object.entries(TYPE_MAP)) {
    if (mimeType.startsWith(prefix)) return folder;
  }
  return 'ads/misc';
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}

export async function POST(request: NextRequest) {
  // Require admin or higher
  const check = await requireAdmin(request);
  if (!check.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const contentType = request.headers.get('content-type') || 'application/octet-stream';
    const xFileName = request.headers.get('x-file-name');
    
    let fileBuffer: Buffer;
    let fileName = '';
    let fileSize = 0;
    let mimeType = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type || 'application/octet-stream';
    } else {
      // Direct binary upload
      const bytes = await request.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = xFileName ? decodeURIComponent(xFileName) : `upload-${Date.now()}`;
      fileSize = bytes.byteLength;
      mimeType = contentType;
    }

    if (fileSize === 0) {
      return NextResponse.json({ error: 'No file content provided' }, { status: 400 });
    }

    const subfolder = getSubfolder(mimeType);
    const ext = fileName.split('.').pop() || 'bin';
    const filename = `${Date.now()}-${sanitize(fileName.replace(/\.[^.]+$/, ''))}.${ext}`;

    const publicDir = path.join(process.cwd(), 'public');
    const uploadDir = path.join(publicDir, 'uploads', subfolder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, filename), fileBuffer);

    const url = `/uploads/${subfolder}/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      name: fileName,
      size: fileSize,
      type: mimeType,
    });
  } catch (e: any) {
    console.error('[ads-upload error]', e);
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}


