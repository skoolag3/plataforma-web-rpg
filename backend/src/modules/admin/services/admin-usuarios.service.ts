import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  AjustarColecaoUsuarioDto,
  AjustarSaldoUsuarioDto,
  UpdateAdminUsuarioDto,
} from '../dto/admin-usuario.dto';

const usuarioSelect = {
  id: true,
  nome: true,
  email: true,
  nivel: true,
  saldo_rubys_cache: true,
  saldo_moedas_cache: true,
  ativo: true,
  bloqueado: true,
  is_admin: true,
  email_verificado: true,
  criado_em: true,
  ultimo_login_em: true,
  _count: { select: { partidas: true } },
} satisfies Prisma.UsuarioSelect;

type UsuarioSelecionado = Prisma.UsuarioGetPayload<{
  select: typeof usuarioSelect;
}>;

@Injectable()
export class AdminUsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: { busca?: string; status?: string }) {
    const q = filtros.busca?.trim();
    const status = filtros.status?.trim();
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        excluido_em: null,
        ...(status === 'ativos' ? { ativo: true, bloqueado: false } : {}),
        ...(status === 'bloqueados' ? { bloqueado: true } : {}),
        ...(status === 'inativos' ? { ativo: false } : {}),
        ...(status === 'admins' ? { is_admin: true } : {}),
        ...(q
          ? {
              OR: [
                { nome: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: usuarioSelect,
      orderBy: [{ criado_em: 'desc' }, { nome: 'asc' }],
    });

    return usuarios.map((usuario) => this.toResponse(usuario));
  }

  async buscar(id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, excluido_em: null },
      select: usuarioSelect,
    });

    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return this.toResponse(usuario);
  }

  async atualizar(id: string, dto: UpdateAdminUsuarioDto, idAdmin: string) {
    const atual = await this.buscar(id);
    if (atual.admin && (dto.bloqueado === true || dto.ativo === false)) {
      throw new BadRequestException(
        'Contas administrativas não podem ser bloqueadas ou inativadas.',
      );
    }
    const usuario = await this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.usuario.update({
        where: { id },
        data: {
          ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
          ...(dto.nivel !== undefined ? { nivel: dto.nivel } : {}),
          ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
          ...(dto.bloqueado !== undefined
            ? {
                bloqueado: dto.bloqueado,
                tentativas_login: dto.bloqueado ? undefined : 0,
              }
            : {}),
          ...(dto.emailVerificado !== undefined
            ? {
                email_verificado: dto.emailVerificado,
                ...(dto.emailVerificado
                  ? {
                      token_verificacao_email: null,
                      token_verificacao_expira_em: null,
                    }
                  : {}),
              }
            : {}),
          atualizado_em: new Date(),
        },
        select: usuarioSelect,
      });

      await tx.logAdminUsuario.create({
        data: {
          id_admin: idAdmin,
          id_usuario: id,
          acao: 'PERFIL_ATUALIZADO',
          categoria: 'CONTA',
          descricao: 'Dados administrativos da conta atualizados.',
          detalhes: {
            alteracoes: { ...dto },
            estadoAnterior: {
              nome: atual.nome,
              nivel: atual.nivel,
              ativo: atual.ativo,
              bloqueado: atual.bloqueado,
              emailVerificado: atual.emailVerificado,
            },
          },
        },
      });

      return atualizado;
    });

    return this.toResponse(usuario);
  }

  async buscarColecao(id: string) {
    await this.buscar(id);
    const [cartas, inventario] = await Promise.all([
      this.prisma.carta.findMany({
        where: { ativo: true, excluido_em: null },
        select: {
          id: true,
          nome: true,
          raridade: true,
          elemento: true,
          foto: true,
          moldura: true,
          config_visual: true,
        },
        orderBy: [{ raridade: 'asc' }, { nome: 'asc' }],
      }),
      this.prisma.inventario.findMany({
        where: { id_usuario: id, quantidade: { gt: 0 } },
        select: { id_carta: true, quantidade: true },
      }),
    ]);

    const quantidades = new Map(
      inventario.map((item) => [item.id_carta, item.quantidade ?? 0]),
    );

    return cartas.map((carta) => ({
      id: carta.id,
      nome: carta.nome,
      raridade: carta.raridade,
      elemento: carta.elemento,
      foto: carta.foto,
      moldura: carta.moldura,
      configVisual: carta.config_visual,
      quantidade: quantidades.get(carta.id) ?? 0,
    }));
  }

  async ajustarColecao(
    id: string,
    dto: AjustarColecaoUsuarioDto,
    idAdmin: string,
  ) {
    if (dto.quantidade === 0) {
      throw new BadRequestException(
        'Informe uma quantidade diferente de zero.',
      );
    }

    await this.buscar(id);
    const carta = await this.prisma.carta.findFirst({
      where: { id: dto.idCarta, ativo: true, excluido_em: null },
      select: { id: true, nome: true },
    });
    if (!carta) throw new NotFoundException('Carta não encontrada ou inativa.');

    await this.prisma.$transaction(async (tx) => {
      const itemAtual = await tx.inventario.findUnique({
        where: {
          id_usuario_id_carta: { id_usuario: id, id_carta: dto.idCarta },
        },
        select: { quantidade: true },
      });
      const quantidadeAnterior = itemAtual?.quantidade ?? 0;

      if (dto.quantidade > 0) {
        await tx.inventario.upsert({
          where: {
            id_usuario_id_carta: { id_usuario: id, id_carta: dto.idCarta },
          },
          create: {
            id_usuario: id,
            id_carta: dto.idCarta,
            quantidade: dto.quantidade,
          },
          update: {
            quantidade: { increment: dto.quantidade },
            atualizado_em: new Date(),
          },
        });
      } else {
        const retiradas = await tx.inventario.updateMany({
          where: {
            id_usuario: id,
            id_carta: dto.idCarta,
            quantidade: { gte: Math.abs(dto.quantidade) },
          },
          data: {
            quantidade: { increment: dto.quantidade },
            atualizado_em: new Date(),
          },
        });
        if (retiradas.count === 0) {
          throw new BadRequestException(
            'O usuário não possui cópias suficientes dessa carta.',
          );
        }

        await tx.inventario.deleteMany({
          where: { id_usuario: id, id_carta: dto.idCarta, quantidade: 0 },
        });
      }

      await tx.logAdminUsuario.create({
        data: {
          id_admin: idAdmin,
          id_usuario: id,
          acao: dto.quantidade > 0 ? 'CARTA_ADICIONADA' : 'CARTA_REMOVIDA',
          categoria: 'COLECAO',
          descricao: `${Math.abs(dto.quantidade)}x ${carta.nome} ${dto.quantidade > 0 ? 'adicionada' : 'removida'} da coleção.`,
          detalhes: {
            idCarta: carta.id,
            nomeCarta: carta.nome,
            quantidade: dto.quantidade,
            quantidadeAnterior,
            quantidadeAtual: quantidadeAnterior + dto.quantidade,
          },
        },
      });
    });

    return this.buscarColecao(id);
  }

  async ajustarSaldos(
    id: string,
    dto: AjustarSaldoUsuarioDto,
    idAdmin: string,
  ) {
    if (dto.rubys === 0 && dto.moedas === 0) {
      throw new BadRequestException('Informe ao menos um ajuste de saldo.');
    }

    const motivo = dto.motivo.trim();
    const usuario = await this.prisma.$transaction(async (tx) => {
      const atual = await tx.usuario.findFirst({
        where: { id, excluido_em: null },
        select: {
          saldo_rubys_cache: true,
          saldo_moedas_cache: true,
        },
      });
      if (!atual) throw new NotFoundException('Usuário não encontrado.');

      const rubysAtuais = atual.saldo_rubys_cache ?? 0;
      const moedasAtuais = atual.saldo_moedas_cache ?? 0;
      if (rubysAtuais + dto.rubys < 0 || moedasAtuais + dto.moedas < 0) {
        throw new BadRequestException(
          'O ajuste não pode deixar o saldo do usuário negativo.',
        );
      }

      const rubysNovos = rubysAtuais + dto.rubys;
      const moedasNovas = moedasAtuais + dto.moedas;
      const alterados = await tx.usuario.updateMany({
        where: {
          id,
          saldo_rubys_cache: atual.saldo_rubys_cache,
          saldo_moedas_cache: atual.saldo_moedas_cache,
        },
        data: {
          saldo_rubys_cache: rubysNovos,
          saldo_moedas_cache: moedasNovas,
          atualizado_em: new Date(),
        },
      });
      if (alterados.count === 0) {
        throw new BadRequestException(
          'O saldo foi alterado por outra operação. Atualize e tente novamente.',
        );
      }

      if (dto.rubys !== 0) {
        await tx.ledgerRuby.create({
          data: {
            id_usuario: id,
            quantidade: dto.rubys,
            motivo: 'AJUSTE_ADMIN',
            id_referencia: idAdmin,
            descricao: motivo,
          },
        });
      }
      if (dto.moedas !== 0) {
        await tx.ledgerMoeda.create({
          data: {
            id_usuario: id,
            quantidade: dto.moedas,
            motivo: 'AJUSTE_ADMIN',
            id_referencia: idAdmin,
            descricao: motivo,
          },
        });
      }

      await tx.logAdminUsuario.create({
        data: {
          id_admin: idAdmin,
          id_usuario: id,
          acao: 'SALDO_AJUSTADO',
          categoria: 'SALDO',
          descricao: motivo,
          detalhes: {
            rubys: dto.rubys,
            moedas: dto.moedas,
            saldoAnterior: { rubys: rubysAtuais, moedas: moedasAtuais },
            saldoAtual: { rubys: rubysNovos, moedas: moedasNovas },
          },
        },
      });

      return tx.usuario.findUniqueOrThrow({
        where: { id },
        select: usuarioSelect,
      });
    });

    return this.toResponse(usuario);
  }

  async buscarAtividade(id: string, limiteInformado?: string) {
    await this.buscar(id);
    const limiteConvertido = Number.parseInt(limiteInformado ?? '50', 10);
    const limite = Number.isFinite(limiteConvertido)
      ? Math.min(100, Math.max(10, limiteConvertido))
      : 50;

    const [rubys, moedas, compras, gachas, auditorias] = await Promise.all([
      this.prisma.ledgerRuby.findMany({
        where: { id_usuario: id },
        orderBy: { criado_em: 'desc' },
        take: limite,
      }),
      this.prisma.ledgerMoeda.findMany({
        where: { id_usuario: id },
        orderBy: { criado_em: 'desc' },
        take: limite,
      }),
      this.prisma.logTransacao.findMany({
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
      this.prisma.logGacha.findMany({
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
      this.prisma.logAdminUsuario.findMany({
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

    const idsAutoria = [
      ...rubys.map((item) => item.id_referencia),
      ...moedas.map((item) => item.id_referencia),
    ].filter((item): item is string => Boolean(item));
    const autores = idsAutoria.length
      ? await this.prisma.usuario.findMany({
          where: { id: { in: idsAutoria }, is_admin: true },
          select: { id: true, nome: true, email: true },
        })
      : [];
    const autorPorId = new Map(autores.map((autor) => [autor.id, autor]));

    const atividade = [
      ...rubys.map((item) => ({
        id: `ruby:${item.id}`,
        tipo: 'RUBY',
        titulo: this.formatarMotivo(item.motivo, 'Movimentação de Rubys'),
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
      ...moedas.map((item) => ({
        id: `moeda:${item.id}`,
        tipo: 'MOEDA',
        titulo: this.formatarMotivo(item.motivo, 'Movimentação de moedas'),
        descricao: item.descricao,
        valor: item.quantidade,
        unidade: 'MOEDAS',
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
        titulo: this.formatarMotivo(item.acao, 'Ação administrativa'),
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

  private formatarMotivo(motivo: string, fallback: string) {
    const titulos: Record<string, string> = {
      AJUSTE_ADMIN: 'Ajuste administrativo',
      GIRO_BANNER: 'Gasto no gacha',
      RECOMPENSA_DIARIA: 'Recompensa diária',
      COMPRA: 'Compra de Rubys',
      BONUS_ADMIN: 'Bônus administrativo',
      REEMBOLSO: 'Reembolso',
      ESTORNO: 'Estorno',
      PERFIL_ATUALIZADO: 'Conta atualizada',
      CARTA_ADICIONADA: 'Carta adicionada',
      CARTA_REMOVIDA: 'Carta removida',
      SALDO_AJUSTADO: 'Saldo ajustado',
    };
    return titulos[motivo] ?? fallback;
  }

  private toResponse(usuario: UsuarioSelecionado) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      nivel: usuario.nivel ?? 1,
      partidas: usuario._count.partidas,
      rubys: usuario.saldo_rubys_cache ?? 0,
      moedas: usuario.saldo_moedas_cache ?? 0,
      ativo: Boolean(usuario.ativo),
      bloqueado: Boolean(usuario.bloqueado),
      admin: Boolean(usuario.is_admin),
      emailVerificado: usuario.email_verificado,
      criadoEm: usuario.criado_em,
      ultimoLoginEm: usuario.ultimo_login_em,
    };
  }
}
