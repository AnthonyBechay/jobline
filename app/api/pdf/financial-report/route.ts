import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { FinancialReportTemplate } from '@/components/pdf/financial-report-template';
import { getPayments } from '@/app/actions/payments';
import { getCosts } from '@/app/actions/costs';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    // Get query parameters for date filtering
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Fetch payments and costs
    const [paymentsResult, costsResult] = await Promise.all([
      getPayments(),
      getCosts(),
    ]);

    let payments = paymentsResult.success && paymentsResult.data ? paymentsResult.data : [];
    let costs = costsResult.success && costsResult.data ? costsResult.data : [];

    // Filter by date range if provided
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      payments = payments.filter((p) => {
        const date = new Date(p.paymentDate);
        return date >= startDate && date <= endDate;
      });

      costs = costs.filter((c) => {
        const date = new Date(c.costDate);
        return date >= startDate && date <= endDate;
      });
    }

    // Generate PDF
    const stream = await renderToStream(
      FinancialReportTemplate({
        payments,
        costs,
        startDate: startDateParam ? new Date(startDateParam) : undefined,
        endDate: endDateParam ? new Date(endDateParam) : undefined,
      })
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF
    const fileName = startDateParam && endDateParam
      ? `financial-report-${startDateParam}-to-${endDateParam}.pdf`
      : `financial-report-all-time.pdf`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating financial report PDF:', error);
    return NextResponse.json({ error: 'Failed to generate financial report' }, { status: 500 });
  }
}
