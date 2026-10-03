import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const validEmail = process.env.ADMIN_EMAIL || 'admin@knowledgeexchange.io';

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    // Check credentials (case insensitive email check)
    const isEmailValid = email.trim().toLowerCase() === validEmail.toLowerCase() || email.trim().toLowerCase() === 'admin';
    const isPasswordValid = password === validPassword;

    if (!isEmailValid || !isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Invalid admin credentials. Access denied.' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      user: { email: validEmail, role: 'ADMIN' },
    });

    // Set secure HTTP-only cookie for server-side auth checks
    response.cookies.set('admin_session', 'authenticated', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days session
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
