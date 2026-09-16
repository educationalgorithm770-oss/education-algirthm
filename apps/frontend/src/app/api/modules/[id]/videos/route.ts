import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateVideoSchema = z.object({
  title: z.string().min(2, 'Video title is required').max(150),
  videoType: z.enum(['youtube', 'bunny', 'direct']).default('youtube'),
  videoSource: z.string().min(1, 'Video URL or ID is required'),
  duration: z.string().optional(),
});

function extractYouTubeId(urlOrId: string): string {
  const clean = urlOrId.trim();
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(clean)) return clean;
  return clean;
}

function extractBunnyId(urlOrId: string): string {
  const clean = urlOrId.trim();
  const match = clean.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (match && match[0]) return match[0];
  return clean.replace(/^bunny:\/\//i, '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!session?.role && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }
    if (session && session.role !== 'admin' && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const moduleId = parseInt(params.id, 10);
    if (isNaN(moduleId)) {
      return NextResponse.json({ success: false, message: 'Invalid module ID.' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = CreateVideoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, videoType, videoSource, duration } = parsed.data;

    let youtubeId: string | null = null;
    let bunnyVideoId: string | null = null;
    let videoUrl: string | null = null;
    let filePath: string = '';

    if (videoType === 'youtube') {
      youtubeId = extractYouTubeId(videoSource);
      filePath = `https://youtube.com/watch?v=${youtubeId}`;
    } else if (videoType === 'bunny') {
      bunnyVideoId = extractBunnyId(videoSource);
      filePath = `bunny://${bunnyVideoId}`;
    } else {
      videoUrl = videoSource.trim();
      filePath = videoUrl;
    }

    const result = await execute(
      `INSERT INTO videos (module_id, title, file_path, duration, youtube_id, bunny_video_id, video_url, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [moduleId, title, filePath, duration || '10:00', youtubeId, bunnyVideoId, videoUrl]
    );

    return NextResponse.json({
      success: true,
      message: 'Video lesson linked successfully.',
      videoId: result.insertId,
    }, { status: 201 });

  } catch (error) {
    console.error('[/api/modules/[id]/videos POST]', error);
    return NextResponse.json({ success: false, message: 'Failed to link video.' }, { status: 500 });
  }
}
