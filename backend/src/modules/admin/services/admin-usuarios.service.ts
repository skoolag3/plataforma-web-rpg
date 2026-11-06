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
  RemoverAdminUsuarioDto,
  UpdateAdminUsuarioDto,
} from '../dto/admin-usuario.dto';

const usuarioSelect = {
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

type UsuarioSelecionado = Prisma.UsuarioGetPayload<{
  select: typeof usuarioSelect;
}>;

@Injectable()
export class AdminUsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: { busca?: string; status?: string; limite?: number }) {
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
      take: filtros.limite
        ? Math.min(200, Math.max(1, filtros.limite))
        : undefined,
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

  async buscarExpedicoes(id: string, paginaInformada?: string) {
    await this.buscar(id);
    const paginaConvertida = Number(paginaInformada);
    const pagina = Number.isSafeInteger(paginaConvertida) && paginaConvertida > 0
      ? Math.min(paginaConvertida, 1000000) : 1;
    const porPagina = 10;
    const where = { id_usuario: id };
    const [total, expedicoes] = await Promise.all([
      this.prisma.expedicao.count({ where }),
      this.prisma.expedicao.findMany({
        where,
        orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          deck: { select: { nome: true } },
          partidas: {
            where: { id_usuario: id },
            orderBy: [{ etapa_expedicao: 'asc' }, { timestamp_inicio: 'asc' }],
            select: {
              id: true, etapa_expedicao: true, resultado: true,
              turnos_jogados: true, recompensa_rubys: true,
              timestamp_inicio: true, timestamp_fim: true,
            },
          },
        },
      }),
    ]);
    return { itens: expedicoes.map((expedicao) => ({
      id: expedicao.id,
      deck: expedicao.deck.nome,
      status: expedicao.status,
      etapaAtual: expedicao.etapa_atual,
      rubys: expedicao.partidas.reduce((total, partida) => total + partida.recompensa_rubys, 0),
      criadoEm: expedicao.criado_em,
      finalizadoEm: expedicao.finalizado_em,
      lutas: expedicao.partidas.map((partida) => ({
        id: partida.id,
        etapa: partida.etapa_expedicao,
        resultado: partida.resultado,
        turnos: partida.turnos_jogados,
        rubys: partida.recompensa_rubys,
        iniciadoEm: partida.timestamp_inicio,
        finalizadoEm: partida.timestamp_fim,
      })),
    })), total, pagina, porPagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) };
  }

  async buscarLogLutaExpedicao(id: string, idExpedicao: string, idLuta: string) {
    const partida = await this.prisma.logPartida.findFirst({
      where: {
        id: idLuta,
        id_expedicao: idExpedicao,
        id_usuario: id,
        expedicao: { id_usuario: id },
      },
      select: {
        id: true, etapa_expedicao: true, resultado: true,
        turnos_jogados: true, recompensa_rubys: true,
        timestamp_inicio: true, timestamp_fim: true,
        eventos: {
          orderBy: { sequencia: 'asc' },
          select: {
            id: true, sequencia: true, turno: true, tipo: true,
            origem: true, texto: true, valor: true, criado_em: true,
          },
        },
      },
    });
    if (!partida) throw new NotFoundException('Luta não encontrada para este usuário e expedição.');
    return {
      id: partida.id,
      etapa: partida.etapa_expedicao,
      resultado: partida.resultado,
      turnos: partida.turnos_jogados,
      rubys: partida.recompensa_rubys,
      iniciadoEm: partida.timestamp_inicio,
      finalizadoEm: partida.timestamp_fim,
      eventos: partida.eventos.map((evento) => ({
        id: evento.id,
        sequencia: evento.sequencia,
        turno: evento.turno,
        tipo: evento.tipo,
        origem: evento.origem,
        texto: evento.texto,
        valor: evento.valor,
        criadoEm: evento.criado_em,
      })),
    };
  }

  async atualizar(id: string, dto: UpdateAdminUsuarioDto, idAdmin: string) {
    const atual = await this.buscar(id);
    if (dto.admin === false) {
      throw new BadRequestException('A remoção de acesso administrativo não está disponível neste editor.');
    }
    if (dto.admin && (dto.ativo === false || dto.bloqueado === true)) {
      throw new BadRequestException('Uma conta administrativa deve permanecer ativa e desbloqueada.');
    }
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
          ...(dto.ativo !== undefined || dto.admin
            ? { ativo: dto.admin ? true : dto.ativo }
            : {}),
          ...(dto.admin ? { is_admin: true } : {}),
          ...(dto.bloqueado !== undefined
            ? {
                bloqueado: dto.bloqueado,
                tentativas_login: dto.bloqueado ? undefined : 0,
              }
            : {}),
          ...(dto.admin ? { bloqueado: false, tentativas_login: 0 } : {}),
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
          acao: dto.admin && !atual.admin ? 'ADMIN_CONCEDIDO' : 'PERFIL_ATUALIZADO',
          categoria: 'CONTA',
          descricao: dto.admin && !atual.admin
            ? 'Acesso administrativo concedido à conta.'
            : 'Dados administrativos da conta atualizados.',
          detalhes: {
            alteracoes: { ...dto },
            estadoAnterior: {
              nome: atual.nome,
              nivel: atual.nivel,
              ativo: atual.ativo,
              bloqueado: atual.bloqueado,
              emailVerificado: atual.emailVerificado,
              admin: atual.admin,
            },
          },
        },
      });

      return atualizado;
    });

    return this.toResponse(usuario);
  }

  async remover(id: string, dto: RemoverAdminUsuarioDto, idAdmin: string) {
    if (id === idAdmin) {
      throw new BadRequestException('Você não pode remover sua própria conta.');
    }
    if (!dto.confirmarImpacto) {
      throw new BadRequestException('Confirme o impacto da remoção.');
    }

    await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findFirst({
        where: { id, excluido_em: null },
        select: { nome: true, email: true, is_admin: true },
      });
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');
      if (usuario.is_admin) {
        throw new BadRequestException(
          'Contas administrativas não podem ser removidas.',
        );
      }
      if (dto.confirmarNome.trim() !== usuario.nome) {
        throw new BadRequestException(
          'O nome de confirmação não corresponde ao usuário.',
        );
      }

      const removido = await tx.usuario.updateMany({
        where: { id, excluido_em: null, is_admin: { not: true } },
        data: {
          ativo: false,
          bloqueado: true,
          excluido_em: new Date(),
          atualizado_em: new Date(),
        },
      });
      if (removido.count !== 1) {
        throw new BadRequestException(
          'A conta foi alterada. Atualize a lista e tente novamente.',
        );
      }

      await tx.logAdminUsuario.create({
        data: {
          id_admin: idAdmin,
          id_usuario: id,
          acao: 'CONTA_REMOVIDA',
          categoria: 'CONTA',
          descricao: 'Conta removida logicamente por um administrador.',
          detalhes: { nome: usuario.nome, email: usuario.email },
        },
      });
    });

    return { message: 'Usuário removido.' };
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
    if (dto.quantidade > 1) {
      throw new BadRequestException('Só é permitido adicionar uma cópia por carta.');
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
        if (quantidadeAnterior > 0) {
          throw new BadRequestException('O usuário já possui essa carta.');
        }
        if (itemAtual) {
          const atualizado = await tx.inventario.updateMany({
            where: {
              id_usuario: id,
              id_carta: dto.idCarta,
              OR: [{ quantidade: { lte: 0 } }, { quantidade: null }],
            },
            data: { quantidade: 1, atualizado_em: new Date() },
          });
          if (atualizado.count !== 1) {
            throw new BadRequestException('O usuário já possui essa carta.');
          }
        } else {
          try {
            await tx.inventario.create({
              data: { id_usuario: id, id_carta: dto.idCarta, quantidade: 1 },
            });
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              throw new BadRequestException('O usuário já possui essa carta.');
            }
            throw error;
          }
        }
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
    if (dto.rubys === 0) {
      throw new BadRequestException('Informe ao menos um ajuste de saldo.');
    }

    const motivo = dto.motivo.trim();
    const usuario = await this.prisma.$transaction(async (tx) => {
      const atual = await tx.usuario.findFirst({
        where: { id, excluido_em: null },
        select: {
          saldo_rubys_cache: true,
        },
      });
      if (!atual) throw new NotFoundException('Usuário não encontrado.');

      const rubysAtuais = atual.saldo_rubys_cache ?? 0;
      if (rubysAtuais + dto.rubys < 0) {
        throw new BadRequestException(
          'O ajuste não pode deixar o saldo do usuário negativo.',
        );
      }

      const rubysNovos = rubysAtuais + dto.rubys;
      const alterados = await tx.usuario.updateMany({
        where: {
          id,
          saldo_rubys_cache: atual.saldo_rubys_cache,
        },
        data: {
          saldo_rubys_cache: rubysNovos,
          atualizado_em: new Date(),
        },
      });
      if (alterados.count === 0) {
        throw new BadRequestException(
          'O saldo foi alterado por outra operação. Atualize e tente novamente.',
        );
      }

      await tx.ledgerRuby.create({
        data: {
          id_usuario: id,
          quantidade: dto.rubys,
          motivo: 'AJUSTE_ADMIN',
          id_referencia: idAdmin,
          descricao: motivo,
        },
      });

      await tx.logAdminUsuario.create({
        data: {
          id_admin: idAdmin,
          id_usuario: id,
          acao: 'SALDO_AJUSTADO',
          categoria: 'SALDO',
          descricao: motivo,
          detalhes: {
            rubys: dto.rubys,
            saldoAnterior: { rubys: rubysAtuais },
            saldoAtual: { rubys: rubysNovos },
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

    const [rubys, compras, gachas, auditorias] = await Promise.all([
      this.prisma.ledgerRuby.findMany({
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

    const idsAutoria = rubys
      .map((item) => item.id_referencia)
      .filter((item): item is string => Boolean(item));
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

  private toResponse(usuario: UsuarioSelecionado) {
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
}
