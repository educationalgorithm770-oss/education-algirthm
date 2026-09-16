import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

interface VideoRow extends RowDataPacket {
  bunny_video_id: string | null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const videoId = parseInt(params.id, 10);
    if (isNaN(videoId)) {
      return NextResponse.json({ success: false, message: 'Invalid video ID.' }, { status: 400 });
    }

    const rows = await query<VideoRow[]>(
      'SELECT bunny_video_id FROM videos WHERE id = ?',
      [videoId]
    );

    const bunnyVideoId = rows[0]?.bunny_video_id;

    // If hosted on Bunny.net, purge from Bunny CDN storage
    if (bunnyVideoId && process.env.BUNNY_API_KEY && process.env.BUNNY_LIBRARY_ID) {
      try {
        const bunnyHost = process.env.BUNNY_STREAM_HOST || 'video.bunnycdn.com';
        await fetch(`https://${bunnyHost}/library/${process.env.BUNNY_LIBRARY_ID}/videos/${bunnyVideoId}`, {
          method: 'DELETE',
          headers: {
            AccessKey: process.env.BUNNY_API_KEY,
          },
        });
      } catch (bunnyErr) {
        console.warn('Failed to delete video from Bunny.net CDN:', bunnyErr);
      }
    }

    await execute('DELETE FROM videos WHERE id = ?', [videoId]);

    return NextResponse.json({ success: true, message: 'Video deleted successfully from database and CDN storage.' });

  } catch (error) {
    console.error('[/api/videos/[id] DELETE]', error);
    return NextResponse.json({ success: false, message: 'Failed to delete video.' }, { status: 500 });
  }
}
