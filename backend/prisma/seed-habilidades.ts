import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { habilidadesIniciais } from '../src/modules/jogo/habilidades/habilidades.iniciais';
import type {
  ConfiguracaoHabilidade,
  EscalaHabilidade,
  RequisitoHabilidade,
} from '../src/modules/jogo/habilidades/habilidade.types';
import { validarHabilidade } from '../src/modules/jogo/habilidades/habilidade.validator';

const connectionString =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Configure DIRECT_DATABASE_URL ou DATABASE_URL.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function executarSeed() {
  const invalidas = habilidadesIniciais
    .map((habilidade) => ({
      nome: habilidade.nome,
      validacao: validarHabilidade(habilidade),
    }))
    .filter((item) => !item.validacao.valida);

  if (invalidas.length) {
    throw new Error(
      `Habilidades inválidas: ${invalidas
        .map((item) => `${item.nome}: ${JSON.stringify(item.validacao.erros)}`)
        .join('; ')}`,
    );
  }

  let criadas = 0;
  let existentes = 0;

  for (const habilidade of habilidadesIniciais) {
    const atual = await prisma.habilidade.findUnique({
      where: { nome: habilidade.nome },
      select: { id: true },
    });

    if (atual) {
      existentes += 1;
      continue;
    }

    await prisma.habilidade.create({
      data: toCreateData(habilidade),
    });
    criadas += 1;
  }

  console.log(
    `Seed concluído: ${criadas} habilidades criadas e ${existentes} já existentes.`,
  );
}

function toCreateData(
  habilidade: ConfiguracaoHabilidade,
): Prisma.HabilidadeCreateInput {
  return {
    nome: habilidade.nome,
    descricao: habilidade.descricao,
    modo_execucao: habilidade.modoExecucao,
    tipo_efeito: habilidade.tipoEfeito,
    gatilho: habilidade.gatilho,
    alvo: habilidade.alvo,
    atributo: habilidade.atributo,
    unidade: habilidade.unidade,
    valor_base: habilidade.valorBase,
    forma_aplicacao: habilidade.formaAplicacao,
    requisito_tipo: habilidade.requisito.tipo,
    requisito_valor: obterRequisitoValor(habilidade.requisito),
    escala_tipo: habilidade.escala.tipo,
    escala_valor: obterEscalaValor(habilidade.escala),
    escala_limite: obterEscalaLimite(habilidade.escala),
    duracao_turnos: habilidade.duracaoTurnos,
    status: 'PUBLICADA',
    versao: 1,
    testada_em: new Date(),
  };
}

function obterRequisitoValor(requisito: RequisitoHabilidade) {
  if (requisito.tipo === 'CONTADOR_ATAQUES') return requisito.quantidade;
  if (requisito.tipo === 'HP_ABAIXO') return requisito.percentual;
  if (requisito.tipo === 'TURNO_MINIMO') return requisito.turno;
  return null;
}

function obterEscalaValor(escala: EscalaHabilidade) {
  return escala.tipo === 'NENHUMA' ? null : escala.valor;
}

function obterEscalaLimite(escala: EscalaHabilidade) {
  return escala.tipo === 'NENHUMA' ? null : escala.limite;
}

executarSeed()
  .catch((error) => {
    console.error('Falha ao criar habilidades iniciais.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
