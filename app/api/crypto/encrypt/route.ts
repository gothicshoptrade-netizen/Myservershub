import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const secretKey = process.env.AES_SECRET_KEY;
    if (!secretKey || secretKey.length !== 64) {
      console.error("AES_SECRET_KEY is improperly configured.");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const key = Buffer.from(secretKey, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');

    return NextResponse.json({
      encrypted,
      iv: iv.toString('base64'),
      authTag,
    });
  } catch (error) {
    console.error('Encryption error:', error);
    return NextResponse.json({ error: 'Encryption failed' }, { status: 500 });
  }
}
