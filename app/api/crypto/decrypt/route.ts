import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export async function POST(req: Request) {
  try {
    const { encrypted, iv, authTag } = await req.json();
    if (!encrypted || !iv || !authTag) {
      return NextResponse.json({ error: 'Missing encryption parameters' }, { status: 400 });
    }

    const secretKey = process.env.AES_SECRET_KEY;
    if (!secretKey || secretKey.length !== 64) {
      console.error("AES_SECRET_KEY is improperly configured.");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const key = Buffer.from(secretKey, 'hex');
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return NextResponse.json({
      decrypted,
    });
  } catch (error) {
    console.error('Decryption error:', error);
    return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
  }
}
