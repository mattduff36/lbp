import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { testParam: string } }
) {
  const { testParam } = params;
  if (!testParam) {
    return NextResponse.json({ error: 'testParam not found in params' }, { status: 400 });
  }
  return NextResponse.json({ message: `PUT request received for testParam: ${testParam}` });
}

export async function GET(
    request: NextRequest,
    { params }: { params: { testParam: string } }
) {
    const { testParam } = params;
    if (!testParam) {
        return NextResponse.json({ error: 'testParam not found in params' }, { status: 400 });
    }
    return NextResponse.json({ message: `GET request received for testParam: ${testParam}` });
} 