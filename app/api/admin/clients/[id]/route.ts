import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers';
// import { verify } from 'jsonwebtoken';
// import { prisma } from '../../../../lib/prisma';
// import { deleteClientFolder, renameClientFolder } from '../../../../lib/googleDrive';

// Helper function to verify admin authentication (commented out for now)
/*
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
*/

// PUT /api/admin/clients/[id] - Update a client (Simplified for diagnosis)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // const isAdmin = await verifyAdmin(request);
  // if (!isAdmin) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const clientId = params.id;

  // try {
  //   const { username, password } = await request.json();
  //   // ... (rest of the original logic commented out)
  // } catch (error) {
  //   console.error('Error updating client:', error);
  //   return NextResponse.json(
  //     { error: 'Failed to update client' },
  //     { status: 500 }
  //   );
  // }
  return NextResponse.json({ message: `Simplified PUT for client ${clientId}` });
} 