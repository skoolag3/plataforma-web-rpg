import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AtualizarDeckDto, CriarDeckDto } from './dto/salvar-deck.dto';

@Injectable()
export class DecksService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(idUsuario: string) {
    const decks = await this.prisma.deck.findMany({
      where: { id_usuario: idUsuario, excluido_em: null },
      include: {
        cartas: {
          include: { carta: true },
          orderBy: { posicao_slot: 'asc' },
        },
      },
      orderBy: [{ ativo: 'desc' }, { atualizado_em: 'desc' }],
    });

    return decks.map((deck) => this.formatar(deck));
  }

  async buscar(idUsuario: string, id: string) {
    const deck = await this.buscarDeck(idUsuario, id);
    return this.formatar(deck);
  }

  async criar(idUsuario: string, dto: CriarDeckDto) {
    await this.validarCartas(idUsuario, dto.cartas, Boolean(dto.ativar));

    const deck = await this.prisma.$transaction(async (tx) => {
      if (dto.ativar) {
        await tx.deck.updateMany({
          where: { id_usuario: idUsuario, ativo: true },
          data: { ativo: false },
        });
      }

      return tx.deck.create({
        data: {
          id_usuario: idUsuario,
          nome: dto.nome.trim(),
          ativo: dto.ativar ?? false,
          cartas: {
            create: dto.cartas.map((idCarta, index) => ({
              id_carta: idCarta,
              posicao_slot: index + 1,
            })),
          },
        },
        include: {
          cartas: {
            include: { carta: true },
            orderBy: { posicao_slot: 'asc' },
          },
        },
      });
    });

    return {
      message: dto.ativar ? 'Deck criado e ativado.' : 'Deck salvo.',
      deck: this.formatar(deck),
    };
  }

  async atualizar(idUsuario: string, id: string, dto: AtualizarDeckDto) {
    const atual = await this.buscarDeck(idUsuario, id);
    const cartas = dto.cartas ?? atual.cartas.map((item) => item.id_carta);
    const ativar = dto.ativar ?? atual.ativo ?? false;
    await this.validarCartas(idUsuario, cartas, ativar);

    const deck = await this.prisma.$transaction(async (tx) => {
      if (ativar) {
        await tx.deck.updateMany({
          where: { id_usuario: idUsuario, ativo: true, id: { not: id } },
          data: { ativo: false },
        });
      }

      if (dto.cartas) {
        await tx.deckCarta.deleteMany({ where: { id_deck: id } });
      }

      return tx.deck.update({
        where: { id },
        data: {
          ...(dto.nome ? { nome: dto.nome.trim() } : {}),
          ...(dto.ativar !== undefined ? { ativo: dto.ativar } : {}),
          ...(dto.cartas
            ? {
                cartas: {
                  create: cartas.map((idCarta, index) => ({
                    id_carta: idCarta,
                    posicao_slot: index + 1,
                  })),
                },
              }
            : {}),
          atualizado_em: new Date(),
        },
        include: {
          cartas: {
            include: { carta: true },
            orderBy: { posicao_slot: 'asc' },
          },
        },
      });
    });

    return {
      message: ativar ? 'Deck atualizado e ativado.' : 'Deck atualizado.',
      deck: this.formatar(deck),
    };
  }

  async ativar(idUsuario: string, id: string) {
    const deck = await this.buscarDeck(idUsuario, id);
    await this.validarCartas(
      idUsuario,
      deck.cartas.map((item) => item.id_carta),
      true,
    );

    await this.prisma.$transaction([
      this.prisma.deck.updateMany({
        where: { id_usuario: idUsuario, ativo: true },
        data: { ativo: false },
      }),
      this.prisma.deck.update({ where: { id }, data: { ativo: true } }),
    ]);

    return { message: 'Deck ativado com sucesso.' };
  }

  async excluir(idUsuario: string, id: string) {
    const deck = await this.buscarDeck(idUsuario, id);

    if (deck.ativo) {
      throw new BadRequestException(
        'Ative outro deck antes de excluir o deck atual.',
      );
    }

    await this.prisma.deck.update({
      where: { id },
      data: { excluido_em: new Date(), ativo: false },
    });

    return { message: 'Deck excluido.' };
  }

  private async validarCartas(
    idUsuario: string,
    idsCartas: string[],
    exigirCompleto: boolean,
  ) {
    if (idsCartas.length > 6) {
      throw new BadRequestException('Um deck pode ter no maximo 6 cartas.');
    }

    if (new Set(idsCartas).size !== idsCartas.length) {
      throw new BadRequestException('Nao e permitido repetir cartas no deck.');
    }

    if (exigirCompleto && idsCartas.length !== 6) {
      throw new BadRequestException(
        'Um deck precisa ter exatamente 6 cartas para ser ativado.',
      );
    }

    if (!idsCartas.length) return;

    const cartasPossuidas = await this.prisma.inventario.count({
      where: {
        id_usuario: idUsuario,
        id_carta: { in: idsCartas },
        quantidade: { gt: 0 },
        carta: { ativo: true, excluido_em: null },
      },
    });

    if (cartasPossuidas !== idsCartas.length) {
      throw new BadRequestException(
        'O deck contem cartas inativas ou que nao pertencem ao jogador.',
      );
    }
  }

  private async buscarDeck(idUsuario: string, id: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { id, id_usuario: idUsuario, excluido_em: null },
      include: {
        cartas: {
          include: { carta: true },
          orderBy: { posicao_slot: 'asc' },
        },
      },
    });

    if (!deck) throw new NotFoundException('Deck nao encontrado.');
    return deck;
  }

  private formatar(
    deck: Prisma.DeckGetPayload<{
      include: {
        cartas: {
          include: { carta: true };
        };
      };
    }>,
  ) {
    return {
      id: deck.id,
      nome: deck.nome,
      ativo: deck.ativo ?? false,
      completo: deck.cartas.length === 6,
      criadoEm: deck.criado_em,
      atualizadoEm: deck.atualizado_em,
      cartas: deck.cartas.map((item) => {
        const passiva =
          item.carta.passiva &&
          typeof item.carta.passiva === 'object' &&
          !Array.isArray(item.carta.passiva)
            ? (item.carta.passiva as Record<string, unknown>)
            : {};
        return {
          id: item.carta.id,
          nome: item.carta.nome,
          raridade: item.carta.raridade,
          elemento: item.carta.elemento,
          classe:
            typeof passiva.classe === 'string' ? passiva.classe : 'Sem classe',
          foto: item.carta.foto,
          moldura: item.carta.moldura,
          configVisual: item.carta.config_visual,
          posicao: item.posicao_slot,
        };
      }),
    };
  }
}
