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
    // Adjusted to match Prisma schema: username, folderId. oldUsername for Drive logic.
    // Email is received but not used for DB operations as it's not in the Client model.
    const { username, email, folderId, oldUsername } = body; 

    if (!username) { // Email validation removed as it's not in the Client model
      return NextResponse.json(
        { error: 'Username is required' }, // Updated error message
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

    // Check if the new username is already taken by another client
    if (username !== existingClient.username) { // Email check removed
        const conflictingClient = await prisma.client.findFirst({
            where: {
                // Only check for username conflict
                username: username, NOT: { id: clientId }
            },
        });
        if (conflictingClient) {
            return NextResponse.json({ error: 'Username already in use by another client' }, { status: 409 });
        }
    }
    
    let updatedDriveFolderId = existingClient.folderId; // Use folderId from schema

    // Rename Google Drive folder if username changed and folderId exists
    if (folderId && username !== oldUsername && oldUsername) { // Use folderId and oldUsername
      try {
        await renameClientFolder(folderId, username); // Call the function
        // If renameClientFolder completes without throwing, it means success.
        console.log(`Client folder ${oldUsername} (ID: ${folderId}) renamed to ${username}.`);
        // The folderId does not change upon renaming, so updatedDriveFolderId remains existingClient.folderId
      } catch (driveError) {
        // This catch is specific to the drive operation. The outer catch will handle broader errors.
        console.error(`Error renaming Google Drive folder for client ${clientId}:`, driveError);
        // As per previous logic, we'll log and proceed with DB update even if Drive rename fails.
      }
    }


    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        username, // Use username from schema
        folderId: updatedDriveFolderId, // This is the original folderId, which is correct.
        // Email is not updated as it's not in the Client model
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
     if ((error as any).code === 'P2002') { // Unique constraint failed (likely on username)
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
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
    // First, retrieve the client to get the folderId
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // If a folderId exists, attempt to delete the Google Drive folder
    if (client.folderId) { // Use folderId from schema
      try {
        await deleteClientFolder(client.folderId); // Use folderId from schema
        console.log(`Google Drive folder for client ${clientId} (ID: ${client.folderId}) deleted successfully.`);
      } catch (driveError) {
        console.error(`Error deleting Google Drive folder for client ${clientId}:`, driveError);
      }
    }

    // Then, delete the client from the database
    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ success: true, message: "Client and associated Google Drive folder (if any) deleted successfully." });
  } catch (error) {
    console.error('Error deleting client:', error);
    if ((error as any).code === 'P2025') { 
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
} 