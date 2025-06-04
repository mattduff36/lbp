import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  context: { params: { clientId: string } }
) {
  const clientIdentifier = context.params.clientId;
  return NextResponse.json({ message: `Simplified PUT for client ${clientIdentifier}` });
} 