import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';
import { deleteClientFolder, renameClientFolder } from '../../../../lib/googleDrive';

// Helper function to verify admin authentication
const verifyAdmin = async (request: Request) => {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return false;
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!);
    return decoded;
  } catch (error) {
    return false;
  }
};

// PUT /api/admin/clients/[id] - Update a client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get the current client data
    const currentClient = await prisma.client.findUnique({
      where: { id: params.id },
      select: { username: true, folderId: true },
    });

    if (!currentClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if username already exists for a different client
    const existingClient = await prisma.client.findFirst({
      where: {
        username,
        NOT: {
          id: params.id,
        },
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // If username has changed and we have a folder ID, rename the folder
    if (username !== currentClient.username && currentClient.folderId) {
      await renameClientFolder(currentClient.folderId, username);
    }

    // Update the client in the database
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        username,
        password,
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/clients/[id] - Delete a client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the client to find their folder ID
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { folderId: true },
    });

    if (client?.folderId) {
      // Delete the Google Drive folder
      await deleteClientFolder(client.folderId);
    }

    // Delete the client from the database
    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
} 