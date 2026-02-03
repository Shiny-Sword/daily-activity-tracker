import { NextRequest, NextResponse } from 'next/server';

// POST /api/export - Export data to CSV
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { activities, goals, startDate, endDate, format } = body;

    if (format === 'csv') {
      // Generate CSV content
      const csvHeader = 'Date,Title,Category,Duration (min),Start Time,End Time,Notes\n';
      const csvRows = activities.map((activity: any) => {
        return [
          activity.date,
          `"${activity.title}"`,
          activity.category,
          activity.duration,
          activity.startTime || '',
          activity.endTime || '',
          `"${activity.notes?.replace(/"/g, '""') || ''}"`
        ].join(',');
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="activities_${startDate}_to_${endDate}.csv"`
        }
      });
    }

    // For JSON export
    const exportData = {
      activities,
      goals,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: {
        totalActivities: activities.length,
        totalTime: activities.reduce((sum: number, act: any) => sum + act.duration, 0),
        categoryBreakdown: activities.reduce((acc: any, act: any) => {
          acc[act.category] = (acc[act.category] || 0) + act.duration;
          return acc;
        }, {})
      }
    };

    return NextResponse.json({ 
      success: true, 
      data: exportData 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}