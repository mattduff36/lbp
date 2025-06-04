import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // Not needed for simplified version
// import { verify } from 'jsonwebtoken'; // Not needed for simplified version
// import { prisma } from '../../../../lib/prisma'; // Not needed for simplified version
// import { deleteClientFolder, renameClientFolder } from '../../../../lib/googleDrive'; // Not needed for simplified version

// PUT /api/admin/clients/[id] - Update a client (Simplified for diagnosis)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Basic check and response
  if (!context.params || !context.params.id) {
    return NextResponse.json({ error: 'ID not found in params' }, { status: 400 });
  }
  const { id } = context.params;
  return NextResponse.json({ message: `PUT request received for ID: ${id}` });
}

/* // Temporarily commented out DELETE function for diagnosis
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const verifyAdmin = async (req: NextRequest) => {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return false;
    try {
      return verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return false;
    }
  };

  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clientData = await prisma.client.findUnique({
      where: { id: context.params.id },
      select: { folderId: true },
    });

    if (clientData?.folderId) {
      await deleteClientFolder(clientData.folderId);
    }

    await prisma.client.delete({
      where: { id: context.params.id },
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
*/ 