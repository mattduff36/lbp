import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // Commented out as verifyAdmin is commented
// import { verify } from 'jsonwebtoken'; // Commented out as verifyAdmin is commented
import { prisma } from '../../../../lib/prisma'; // Keep for now, was in passing test-route
// Google Drive imports removed for now to stabilize build
// import { deleteClientFolder, renameClientFolder } from '../../../../lib/googleDrive';

/* // Helper function to verify admin authentication - COMMENTED OUT FOR DIAGNOSTIC
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
*/

// PUT /api/admin/clientOps/[clientId] - Update a client
export async function PUT(
  request: NextRequest, // request param kept for signature, though not used if verifyAdmin is out
  context: { params: { clientId: string } }
) {
  // const isAdmin = await verifyAdmin(request); // COMMENTED OUT FOR DIAGNOSTIC
  // if (!isAdmin) { // COMMENTED OUT FOR DIAGNOSTIC
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const { clientId } = context.params;
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is missing' }, { status: 400 });
  }

  // try...catch block removed in previous step, PUT handler is now direct
  return NextResponse.json({ message: "Extremely minimal PUT, no verifyAdmin, no DB calls" });
}

/* // DELETE handler commented out for diagnostic
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
    console.log(`Attempting to delete client ${clientId} from database. Drive folder deletion is temporarily disabled.`);

    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ success: true, message: "Client deleted from database. Drive folder deletion currently disabled." });
  } catch (error) {
    console.error('Error deleting client:', error);
    if ((error as any).code === 'P2025') { // Prisma error for record not found
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
*/ 