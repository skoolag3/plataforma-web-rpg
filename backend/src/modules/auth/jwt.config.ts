export function obterJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (jwtSecret) {
    return jwtSecret;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test-secret-not-for-production';
  }

  throw new Error(
    'JWT_SECRET não configurado. Defina uma chave forte antes de iniciar o backend.',
  );
}
