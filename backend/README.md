# Backend AnimeCards

API NestJS autoritativa do projeto AnimeCards. A documentação completa, a arquitetura, as variáveis de ambiente e o estado das funcionalidades estão em [../README.md](../README.md).

## Comandos

```powershell
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed:habilidades
npm run start:dev
npm test -- --runInBand
npm run build
```

Copie `.env.example` para `.env` e configure ao menos `DATABASE_URL` e `JWT_SECRET`. O backend local responde em http://localhost:3001.
