const args = process.argv.slice(2);
const baseUrl = (args.find((arg) => !arg.startsWith('--')) ?? 'http://localhost:3001').replace(/\/$/, '');
const authorizedRemote = args.includes('--authorized-remote');
const parsedUrl = new URL(baseUrl);
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

if (!localHosts.has(parsedUrl.hostname) && !authorizedRemote) {
  console.error('Destino remoto bloqueado. Use --authorized-remote somente com autorização explícita.');
  process.exit(2);
}

const requests = [
  { id: '404-SEGURO', method: 'GET', path: '/auditoria-rota-inexistente' },
  { id: 'AUTH-SEM-TOKEN', method: 'GET', path: '/auth/me' },
  { id: 'AUTH-TOKEN-INVALIDO', method: 'GET', path: '/auth/me', headers: { authorization: 'Bearer token-invalido-auditoria' } },
  { id: 'ADMIN-SEM-TOKEN', method: 'GET', path: '/admin/dashboard' },
  { id: 'DTO-LOGIN-VAZIO', method: 'POST', path: '/auth/login', body: {} },
  { id: 'LOGIN-INEXISTENTE', method: 'POST', path: '/auth/login', body: { email: 'auditoria-inexistente@example.invalid', senha: 'Teste@123456' } },
  {
    id: 'CORS-ORIGEM-EXTERNA',
    method: 'OPTIONS',
    path: '/auth/login',
    headers: {
      origin: 'https://origem-nao-autorizada.example',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  },
];

const resultados = [];

for (const request of requests) {
  const headers = { accept: 'application/json', ...request.headers };
  if (request.body !== undefined) headers['content-type'] = 'application/json';
  try {
    const response = await fetch(`${baseUrl}${request.path}`, {
      method: request.method,
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      redirect: 'manual',
    });
    const responseBody = (await response.text()).slice(0, 1500);
    resultados.push({
      id: request.id,
      method: request.method,
      path: request.path,
      status: response.status,
      headers: {
        allowOrigin: response.headers.get('access-control-allow-origin'),
        contentSecurityPolicy: response.headers.get('content-security-policy'),
        frameOptions: response.headers.get('x-frame-options'),
        contentTypeOptions: response.headers.get('x-content-type-options'),
        poweredBy: response.headers.get('x-powered-by'),
      },
      body: responseBody,
    });
  } catch (error) {
    resultados.push({ id: request.id, method: request.method, path: request.path, erro: error.message });
  }
}

console.log(JSON.stringify({ alvo: baseUrl, horario: new Date().toISOString(), total: resultados.length, resultados }, null, 2));
