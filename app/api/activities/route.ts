import { NextRequest, NextResponse } from 'next/server';
import { Activity } from '@/lib/types';

// GET /api/activities - Fetch all activities
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const category = searchParams.get('category');
    
    // In a real app, this would fetch from database
    // For now, we'll return a structure for client-side handling
    return NextResponse.json({ 
      success: true,
      message: 'Use client-side storage for this demo',
      filters: { date, category }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create new activity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, category, startTime, endTime, duration, notes } = body;

    // Validate required fields
    if (!title || !category || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real app, save to database
    const activity: Partial<Activity> = {
      title,
      description,
      category,
      startTime,
      endTime,
      duration,
      notes: notes || '',
      date: new Date().toISOString().split('T')[0],
      completed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true, 
      data: activity,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

// PUT /api/activities/[id] - Update activity
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // In a real app, update in database
    const updatedActivity = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true, 
      data: updatedActivity,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

// DELETE /api/activities/[id] - Delete activity
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Activity ID required' },
        { status: 400 }
      );
    }

    // In a real app, delete from database
    return NextResponse.json({ 
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}