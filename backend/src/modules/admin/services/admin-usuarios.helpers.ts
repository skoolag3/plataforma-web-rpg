import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../database/prisma.service';

export const usuarioSelect = {
  id: true,
  nome: true,
  email: true,
  nivel: true,
  saldo_rubys_cache: true,
  ativo: true,
  bloqueado: true,
  is_admin: true,
  email_verificado: true,
  criado_em: true,
  ultimo_login_em: true,
  _count: { select: { partidas: true } },
  perfil: {
    select: {
      avatar_url: true,
      id_moldura: true,
      id_carta_moldura: true,
      molduraSelecionada: {
        select: { nome: true, classe_css: true },
      },
      cartaMolduraSelecionada: {
        select: { nome: true, moldura: true, config_visual: true },
      },
    },
  },
} satisfies Prisma.UsuarioSelect;

export type UsuarioSelecionado = Prisma.UsuarioGetPayload<{
  select: typeof usuarioSelect;
}>;

export function formatarMotivoAdminUsuario(motivo: string, fallback: string) {
  const titulos: Record<string, string> = {
    AJUSTE_ADMIN: 'Ajuste administrativo',
    GIRO_BANNER: 'Gasto no gacha',
    RECOMPENSA_DIARIA: 'Recompensa diária',
    RECOMPENSA_SEMANAL: 'Recompensa semanal',
    COMPRA: 'Compra de Rubys',
    BONUS_ADMIN: 'Bônus administrativo',
    REEMBOLSO: 'Reembolso',
    ESTORNO: 'Estorno',
    PERFIL_ATUALIZADO: 'Conta atualizada',
    CONTA_REMOVIDA: 'Conta removida',
    CARTA_ADICIONADA: 'Ação administrativa: carta adicionada',
    CARTA_REMOVIDA: 'Ação administrativa: carta removida',
    SALDO_AJUSTADO: 'Ação administrativa: saldo ajustado',
  };
  return titulos[motivo] ?? fallback;
}

export function formatarUsuarioAdminResponse(usuario: UsuarioSelecionado) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    nivel: usuario.nivel ?? 1,
    partidas: usuario._count.partidas,
    rubys: usuario.saldo_rubys_cache ?? 0,
    ativo: Boolean(usuario.ativo),
    bloqueado: Boolean(usuario.bloqueado),
    admin: Boolean(usuario.is_admin),
    emailVerificado: usuario.email_verificado,
    criadoEm: usuario.criado_em,
    ultimoLoginEm: usuario.ultimo_login_em,
    avatarUrl: usuario.perfil?.avatar_url ?? null,
    molduraId:
      usuario.perfil?.id_moldura ?? usuario.perfil?.id_carta_moldura ?? null,
    molduraClasse: usuario.perfil?.cartaMolduraSelecionada
      ? 'molduraCarta'
      : (usuario.perfil?.molduraSelecionada?.classe_css ?? 'molduraPadrao'),
    molduraUrl: usuario.perfil?.cartaMolduraSelecionada?.moldura ?? null,
    molduraConfig:
      usuario.perfil?.cartaMolduraSelecionada?.config_visual ?? null,
  };
}

export async function consultarAtividadeUsuarioAdmin(
  prisma: PrismaService,
  id: string,
  limite: number,
) {
  const [rubys, compras, gachas, auditorias] = await Promise.all([
    prisma.ledgerRuby.findMany({
      where: { id_usuario: id },
      orderBy: { criado_em: 'desc' },
      take: limite,
    }),
    prisma.logTransacao.findMany({
      where: { id_usuario: id },
      select: {
        id: true,
        valor_brl: true,
        status_pagamento: true,
        timestamp_compra: true,
        pacote: { select: { nome: true, quantidade_rubys: true } },
      },
      orderBy: { timestamp_compra: 'desc' },
      take: limite,
    }),
    prisma.logGacha.findMany({
      where: { id_usuario: id },
      select: {
        id: true,
        rubys_gastos: true,
        timestamp_pull: true,
        cartaObtida: { select: { nome: true } },
        banner: { select: { nome: true } },
      },
      orderBy: { timestamp_pull: 'desc' },
      take: limite,
    }),
    prisma.logAdminUsuario.findMany({
      where: { id_usuario: id },
      select: {
        id: true,
        acao: true,
        categoria: true,
        descricao: true,
        detalhes: true,
        criado_em: true,
        admin: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { criado_em: 'desc' },
      take: limite,
    }),
  ]);

  const idsAutoria = rubys
    .map((item) => item.id_referencia)
    .filter((item): item is string => Boolean(item));
  const autores = idsAutoria.length
    ? await prisma.usuario.findMany({
        where: { id: { in: idsAutoria }, is_admin: true },
        select: { id: true, nome: true, email: true },
      })
    : [];
  const autorPorId = new Map(autores.map((autor) => [autor.id, autor]));

  const atividade = [
    ...rubys.map((item) => ({
      id: `ruby:${item.id}`,
      tipo: 'RUBY',
      titulo: formatarMotivoAdminUsuario(item.motivo, 'Movimentação de Rubys'),
      descricao: item.descricao,
      valor: item.quantidade,
      unidade: 'RUBYS',
      natureza: item.quantidade >= 0 ? 'ENTRADA' : 'SAIDA',
      criadoEm: item.criado_em,
      autoria: item.id_referencia
        ? (autorPorId.get(item.id_referencia) ?? null)
        : null,
      detalhes: null,
    })),
    ...compras.map((item) => ({
      id: `compra:${item.id}`,
      tipo: 'COMPRA',
      titulo: item.pacote?.nome ?? 'Compra de Rubys',
      descricao: `Pagamento ${item.status_pagamento.toLocaleLowerCase('pt-BR')}.`,
      valor: Number(item.valor_brl),
      unidade: 'BRL',
      natureza: 'NEUTRO',
      criadoEm: item.timestamp_compra,
      autoria: null,
      detalhes: item.pacote
        ? { rubysRecebidos: item.pacote.quantidade_rubys }
        : null,
    })),
    ...gachas.map((item) => ({
      id: `gacha:${item.id}`,
      tipo: 'GACHA',
      titulo: `Carta obtida: ${item.cartaObtida.nome}`,
      descricao: `Banner ${item.banner.nome}.`,
      valor: -item.rubys_gastos,
      unidade: 'RUBYS',
      natureza: 'SAIDA',
      criadoEm: item.timestamp_pull,
      autoria: null,
      detalhes: null,
    })),
    ...auditorias.map((item) => ({
      id: `admin:${item.id}`,
      tipo: 'ADMIN',
      titulo: formatarMotivoAdminUsuario(item.acao, 'Ação administrativa'),
      descricao: item.descricao,
      valor: null,
      unidade: null,
      natureza: 'NEUTRO',
      criadoEm: item.criado_em,
      autoria: item.admin,
      detalhes: {
        categoria: item.categoria,
        dados: item.detalhes,
      },
    })),
  ];

  return atividade
    .sort(
      (a, b) =>
        new Date(b.criadoEm ?? 0).getTime() -
        new Date(a.criadoEm ?? 0).getTime(),
    )
    .slice(0, limite);
}
