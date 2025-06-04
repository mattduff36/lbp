import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';
import { deleteClientFolder, renameClientFolder } from '../../../../lib/googleDrive';

// Helper function to verify admin authentication
const verifyAdmin = async (request: NextRequest) => {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return false;
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!);
    return decoded;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
};

// PUT /api/admin/clientOps/[clientId] - Update a client
export async function PUT(
  request: NextRequest,
  context: { params: { clientId: string } }
) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = context.params;
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is missing' }, { status: 400 });
  }

  // Original PUT try...catch block is replaced by DELETE's try...catch for diagnostics
  try {
    // Copied from DELETE handler
    const clientData = await prisma.client.findUnique({
      where: { id: clientId },
      select: { folderId: true },
    });

    if (clientData?.folderId) {
      try {
        await deleteClientFolder(clientData.folderId);
      } catch (driveError) {
        console.error('Google Drive folder deletion failed:', driveError);
        // Optionally, decide if this error should prevent client deletion
        // For now, proceeding with DB deletion even if Drive deletion fails
      }
    }

    await prisma.client.delete({
      where: { id: clientId },
    });
    // End of critically copied logic from DELETE that performs actual deletion

    return NextResponse.json({ message: "PUT handler with DELETE's logic - DIAGNOSTIC", success: true });
  } catch (error) {
    // Copied from DELETE handler
    console.error('Error in PUT (acting as DELETE for diagnostic):', error);
    // Check for specific Prisma error for record not found if that's useful
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Client not found (in PUT as DELETE diagnostic)' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed in PUT (acting as DELETE for diagnostic)' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/clientOps/[clientId] - Delete a client
export async function DELETE(
  request: NextRequest,
  context: { params: { clientId: string } }
) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = context.params;
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is missing' }, { status: 400 });
  }

  try {
    const clientData = await prisma.client.findUnique({
      where: { id: clientId },
      select: { folderId: true },
    });

    if (clientData?.folderId) {
      try {
        await deleteClientFolder(clientData.folderId);
      } catch (driveError) {
        console.error('Google Drive folder deletion failed:', driveError);
        // Optionally, decide if this error should prevent client deletion
        // For now, proceeding with DB deletion even if Drive deletion fails
      }
    }

    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    // Check for specific Prisma error for record not found if that's useful
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
} 