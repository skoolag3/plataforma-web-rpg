import { createHmac } from 'crypto';

export function obterJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (jwtSecret) {
    if (process.env.NODE_ENV !== 'test' && jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET muito curto. Utilize uma chave com pelo menos 32 caracteres de alta entropia.',
      );
    }
    return jwtSecret;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test-secret-not-for-production-32-chars';
  }

  throw new Error(
    'JWT_SECRET não configurado. Defina uma chave forte antes de iniciar o backend.',
  );
}

export function obterOAuthStateSecret(): string {
  return createHmac('sha256', obterJwtSecret())
    .update('elusivedeck:oauth-state-v1')
    .digest('hex');
}
