import { NextResponse, type NextRequest } from 'next/server';

const REALM = 'WorkflowStarter';

function unauthorized(message = 'Autenticación requerida.') {
  return new NextResponse(message, {
    status: 401,
    headers: {
      'Cache-Control': 'no-store',
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

async function digest(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
}

async function secureEqual(received: string, expected: string): Promise<boolean> {
  const [receivedHash, expectedHash] = await Promise.all([
    digest(received),
    digest(expected),
  ]);
  const left = new Uint8Array(receivedHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function decodeCredentials(header: string): { username: string; password: string } | null {
  if (!header.startsWith('Basic ')) return null;

  try {
    const encoded = header.slice(6).trim();
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const separator = decoded.indexOf(':');
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const expectedUsername = process.env.DASHBOARD_USERNAME?.trim() || 'admin';
  const expectedPassword = process.env.DASHBOARD_PASSWORD;

  if (!expectedPassword) {
    return new NextResponse('DASHBOARD_PASSWORD no está configurada.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const credentials = decodeCredentials(request.headers.get('authorization') ?? '');
  if (!credentials) return unauthorized();

  const [validUsername, validPassword] = await Promise.all([
    secureEqual(credentials.username, expectedUsername),
    secureEqual(credentials.password, expectedPassword),
  ]);

  if (!validUsername || !validPassword) {
    return unauthorized('Credenciales incorrectas.');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!favicon.svg).*)'],
};
