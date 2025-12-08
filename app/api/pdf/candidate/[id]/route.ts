import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { CandidateCVTemplate } from '@/components/pdf/candidate-cv-template';
import { db } from '@/lib/db';
import { candidates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth();

    // Fetch candidate with company check
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
    });

    if (!candidate || candidate.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Generate PDF
    const stream = await renderToStream(
      CandidateCVTemplate({ candidate: candidate as any })
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
        'Content-Disposition': `attachment; filename="candidate-cv-${candidate.firstName}-${candidate.lastName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
