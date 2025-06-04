import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';
import { deleteClientFolder, renameClientFolder } from '../../../../lib/googleDrive';

// Helper function to verify admin authentication (restored)
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
    return false;
  }
};

// PUT /api/admin/clients/[id] - Update a client (Restored with new context type)
export async function PUT(
  request: NextRequest,
  context: { params?: { [key: string]: string | string[] | undefined } } // More generic context type
) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Type guard and extraction for clientId
  if (!context.params || typeof context.params.id !== 'string') {
    return NextResponse.json({ error: 'Client ID must be a string and is required in params.' }, { status: 400 });
  }
  const clientId: string = context.params.id;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const currentClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: { username: true, folderId: true },
    });

    if (!currentClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const existingClient = await prisma.client.findFirst({
      where: {
        username,
        NOT: {
          id: clientId,
        },
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    if (username !== currentClient.username && currentClient.folderId) {
      await renameClientFolder(currentClient.folderId, username);
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        username,
        password,
      },
    });

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/clients/[id] - Delete a client (Restored with new context type)
export async function DELETE(
  request: NextRequest,
  context: { params?: { [key: string]: string | string[] | undefined } } // More generic context type
) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Type guard and extraction for clientId
  if (!context.params || typeof context.params.id !== 'string') {
    return NextResponse.json({ error: 'Client ID must be a string and is required in params.' }, { status: 400 });
  }
  const clientId: string = context.params.id;

  try {
    const clientData = await prisma.client.findUnique({
      where: { id: clientId },
      select: { folderId: true },
    });

    if (clientData?.folderId) {
      await deleteClientFolder(clientData.folderId);
    }

    await prisma.client.delete({
      where: { id: clientId },
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