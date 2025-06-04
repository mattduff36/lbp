import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';
import { deleteClientFolder, renameClientFolder } from '../../../../lib/googleDrive';

interface DecodedToken {
  userId: string;
  // Add other token properties if they exist
}

// Helper function to verify admin authentication
const verifyAdmin = async (request: NextRequest): Promise<DecodedToken | false> => {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return false;
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
};

// PUT /api/admin/clientOps/[clientId] - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = params;
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is missing' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, email, driveFolderId, oldName } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if the new name or email is already taken by another client
    if (name !== existingClient.name || email !== existingClient.email) {
        const conflictingClient = await prisma.client.findFirst({
            where: {
                OR: [
                    { name: name, NOT: { id: clientId } },
                    { email: email, NOT: { id: clientId } },
                ],
            },
        });
        if (conflictingClient) {
            return NextResponse.json({ error: 'Name or email already in use by another client' }, { status: 409 });
        }
    }
    
    let updatedDriveFolderId = existingClient.driveFolderId;

    // Rename Google Drive folder if name changed and driveFolderId exists
    if (driveFolderId && name !== oldName && oldName) {
      try {
        const newDriveFolderId = await renameClientFolder(driveFolderId, name);
        if (newDriveFolderId) {
          updatedDriveFolderId = newDriveFolderId; // Update if rename returns a new ID (though typically it doesn't)
          console.log(`Client folder ${oldName} (ID: ${driveFolderId}) renamed to ${name}.`);
        } else {
          // If renameClientFolder returns null or undefined, it might indicate an issue
          // or that the folder was not found, or an error occurred.
          // Decide if this should be a blocking error or just a warning.
          // For now, we'll log it and proceed without updating driveFolderId if rename fails this way.
          console.warn(`Could not rename folder for client ID ${clientId}. Proceeding with DB update.`);
        }
      } catch (driveError) {
        console.error(`Error renaming Google Drive folder for client ${clientId}:`, driveError);
        // Depending on policy, you might want to stop the update or allow it to proceed
        // For now, let's allow DB update to proceed but log the error
        // return NextResponse.json({ error: 'Failed to rename client folder on Google Drive' }, { status: 500 });
      }
    }


    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        email,
        driveFolderId: updatedDriveFolderId, // Use the potentially updated driveFolderId
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
     if ((error as any).code === 'P2002') { // Unique constraint failed
      return NextResponse.json({ error: 'Client name or email already exists' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/clientOps/[clientId] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = params;
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is missing' }, { status: 400 });
  }

  try {
    // First, retrieve the client to get the driveFolderId
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // If a driveFolderId exists, attempt to delete the Google Drive folder
    if (client.driveFolderId) {
      try {
        await deleteClientFolder(client.driveFolderId);
        console.log(`Google Drive folder for client ${clientId} (ID: ${client.driveFolderId}) deleted successfully.`);
      } catch (driveError) {
        console.error(`Error deleting Google Drive folder for client ${clientId}:`, driveError);
        // Decide if this should be a blocking error.
        // For now, we'll log the error and proceed with deleting the client from the DB.
        // return NextResponse.json({ error: 'Failed to delete client folder from Google Drive. Database record not deleted.' }, { status: 500 });
      }
    }

    // Then, delete the client from the database
    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ success: true, message: "Client and associated Google Drive folder (if any) deleted successfully." });
  } catch (error) {
    console.error('Error deleting client:', error);
    if ((error as any).code === 'P2025') { // Prisma error for record not found (already handled by findUnique check)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
} 