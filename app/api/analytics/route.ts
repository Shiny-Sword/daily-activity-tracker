import { NextRequest, NextResponse } from 'next/server';

// GET /api/analytics - Get analytics data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week'; // day, week, month
    const category = searchParams.get('category');

    // In a real app, this would calculate analytics from database
    // For now, return structure for client-side processing
    return NextResponse.json({ 
      success: true,
      data: {
        period,
        category,
        message: 'Analytics calculated on client-side for this demo'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/summary - Get activity summary
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { activities, goals, period } = body;

    // Calculate summary metrics
    const totalTime = activities.reduce((sum: number, act: any) => sum + act.duration, 0);
    const categoryBreakdown = activities.reduce((acc: any, act: any) => {
      acc[act.category] = (acc[act.category] || 0) + act.duration;
      return acc;
    }, {});

    const goalProgress = goals.map((goal: any) => {
      const categoryTime = categoryBreakdown[goal.category] || 0;
      const progress = Math.min((categoryTime / goal.targetMinutes) * 100, 100);
      return { ...goal, actualTime: categoryTime, progress };
    });

    const summary = {
      totalActivities: activities.length,
      totalTime,
      averagePerDay: totalTime / 7, // assuming week view
      categoryBreakdown,
      goalProgress,
      productivity: calculateProductivityScore(activities, goals),
      trends: calculateTrends(activities)
    };

    return NextResponse.json({ 
      success: true, 
      data: summary 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to calculate summary' },
      { status: 500 }
    );
  }
}

function calculateProductivityScore(activities: any[], goals: any[]): number {
  // Simple productivity calculation based on goal completion
  const completedGoals = goals.filter(goal => goal.progress >= 100).length;
  return goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
}

function calculateTrends(activities: any[]): any {
  // Calculate weekly trends
  const dailyTotals: Record<string, number> = {};
  
  activities.forEach(activity => {
    dailyTotals[activity.date] = (dailyTotals[activity.date] || 0) + activity.duration;
  });

  return {
    dailyTotals,
    averageDaily: Object.values(dailyTotals).reduce((a, b) => a + b, 0) / Object.keys(dailyTotals).length || 0
  };
}