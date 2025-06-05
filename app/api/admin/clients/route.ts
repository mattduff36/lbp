import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';
import { createClientFolder } from '../../../lib/googleDrive';

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

// GET /api/admin/clients - Get all clients
export async function GET(request: Request) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        username: true,
        password: true,
        folderId: true,
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/admin/clients - Create a new client
export async function POST(request: Request) {
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

    // Check if username already exists
    const existingClient = await prisma.client.findUnique({
      where: { username },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Create Google Drive folder for the client using a lowercase version of the username
    const folderNameForDrive = username.toLowerCase();
    const folderId = await createClientFolder(folderNameForDrive);

    // Create client in database with folder ID and original username casing
    const client = await prisma.client.create({
      data: {
        username,
        password,
        folderId,
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
} 