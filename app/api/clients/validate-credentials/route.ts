import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
// It's highly recommended to use a hashing library like bcrypt for password management
// import bcrypt from 'bcryptjs'; 

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required.' }, { status: 400 });
    }

    // Use findFirst with a case-insensitive search for the username
    const client = await prisma.client.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    if (!client) {
      // Keep the error message generic to avoid leaking information about existing usernames
      return NextResponse.json({ success: false, message: 'Invalid username or password.' }, { status: 401 });
    }

    // IMPORTANT: This is a direct string comparison.
    // In a production environment, passwords should be hashed.
    // If client.password is hashed, you would use bcrypt.compareSync(password, client.password);
    const isPasswordValid = client.password === password; 

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: 'Invalid username or password.' }, { status: 401 });
    }

    // If username and password are valid
    // Omit sensitive data like password from the response if you were to return client details
    return NextResponse.json({ success: true, message: 'Login successful.' });

  } catch (error) {
    console.error('Error validating client credentials:', error);
    // Generic error message for security
    return NextResponse.json({ success: false, message: 'An error occurred during login. Please try again.' }, { status: 500 });
  }
} 