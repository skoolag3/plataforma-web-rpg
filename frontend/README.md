# Frontend AnimeCards

Cliente Next.js do projeto AnimeCards. A documentação completa, o estado das funcionalidades e as instruções de execução estão em [../README.md](../README.md).

## Comandos

```powershell
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

O desenvolvimento local usa http://localhost:3000 e encaminha `/api/*` ao backend configurado por `BACKEND_URL`, com fallback para http://localhost:3001.
