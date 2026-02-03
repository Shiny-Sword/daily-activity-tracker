import { NextRequest, NextResponse } from 'next/server';
import { Goal } from '@/lib/types';

// GET /api/goals - Fetch all goals
export async function GET() {
  try {
    return NextResponse.json({ 
      success: true,
      message: 'Use client-side storage for this demo'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create new goal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, targetMinutes, type, deadline, description } = body;

    // Validate required fields
    if (!title || !category || !targetMinutes || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real app, save to database
    const goal: Partial<Goal> = {
      title,
      category,
      targetMinutes,
      type,
      deadline,
      description: description || '',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true, 
      data: goal,
      message: 'Goal created successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Update goal
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    const updatedGoal = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true, 
      data: updatedGoal,
      message: 'Goal updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete goal
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Goal ID required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}