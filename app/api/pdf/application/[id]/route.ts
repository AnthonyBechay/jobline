import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ApplicationDocumentTemplate } from '@/components/pdf/application-document-template';
import { db } from '@/lib/db';
import { applications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth();

    // Fetch application with relations and company check
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, params.id),
      with: {
        candidate: true,
        client: true,
        broker: true,
      },
    });

    if (!application || application.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Generate PDF
    const stream = await renderToStream(
      ApplicationDocumentTemplate({ application: application as any })
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="application-${application.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
