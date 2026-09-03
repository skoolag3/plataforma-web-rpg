import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ListarColecaoDto } from './dto/listar-colecao.dto';
import { obterValorVendaPorRaridade } from './valor-venda-raridade';

@Injectable()
export class ColecaoService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(idUsuario: string, filtros: ListarColecaoDto) {
    const cartas = await this.prisma.carta.findMany({
      where: {
        ativo: true,
        excluido_em: null,
        ...(filtros.raridade ? { raridade: filtros.raridade } : {}),
        ...(filtros.elemento ? { elemento: filtros.elemento } : {}),
        ...(filtros.busca
          ? { nome: { contains: filtros.busca.trim(), mode: 'insensitive' } }
          : {}),
      },
      include: {
        habilidades: {
          where: { habilidade: { status: 'PUBLICADA' } },
          include: { habilidade: true },
          orderBy: { ordem: 'asc' },
        },
        inventarios: {
          where: { id_usuario: idUsuario },
          select: { quantidade: true, criado_em: true },
          take: 1,
        },
      },
      orderBy: [{ nome: 'asc' }],
    });

    const itens = cartas
      .map((carta) => {
        const passiva =
          carta.passiva &&
          typeof carta.passiva === 'object' &&
          !Array.isArray(carta.passiva)
            ? (carta.passiva as Record<string, unknown>)
            : {};
        const quantidade = carta.inventarios[0]?.quantidade ?? 0;
        const habilidades = carta.habilidades.map((item) => item.habilidade);
        const passivaExibicao =
          typeof passiva.nome === 'string' || !habilidades.length
            ? passiva
            : {
                ...passiva,
                nome: habilidades
                  .map((habilidade) => habilidade.nome)
                  .join(', '),
                descricao: habilidades
                  .map((habilidade) => habilidade.descricao)
                  .filter(Boolean)
                  .join(' '),
              };

        return {
          id: carta.id,
          nome: carta.nome,
          raridade: carta.raridade,
          elemento: carta.elemento,
          classe:
            typeof passiva.classe === 'string' ? passiva.classe : 'Sem classe',
          custo: obterValorVendaPorRaridade(carta.raridade),
          hpBase: carta.hp_base,
          danoBase: carta.dano_base,
          defesaBase: carta.defesa_base,
          passiva: passivaExibicao,
          foto: carta.foto,
          moldura: carta.moldura,
          configVisual: carta.config_visual,
          quantidade,
          obtida: quantidade > 0,
          obtidaEm: carta.inventarios[0]?.criado_em ?? null,
        };
      })
      .filter(
        (carta) =>
          !filtros.classe ||
          carta.classe.toLocaleLowerCase('pt-BR') ===
            filtros.classe.toLocaleLowerCase('pt-BR'),
      )
      .filter((carta) => !filtros.custo || carta.custo === filtros.custo)
      .filter((carta) => {
        if (filtros.posse === 'obtidas') return carta.obtida;
        if (filtros.posse === 'nao-obtidas') return !carta.obtida;
        return true;
      });

    const [totalCartas, cartasObtidas, usuario] = await Promise.all([
      this.prisma.carta.count({
        where: { ativo: true, excluido_em: null },
      }),
      this.prisma.inventario.count({
        where: {
          id_usuario: idUsuario,
          quantidade: { gt: 0 },
          carta: { ativo: true, excluido_em: null },
        },
      }),
      this.prisma.usuario.findUniqueOrThrow({
        where: { id: idUsuario },
        select: {
          nome: true,
          nivel: true,
          saldo_rubys_cache: true,
          perfil: { select: { avatar_url: true } },
        },
      }),
    ]);

    return {
      itens,
      resumo: {
        totalCartas,
        cartasObtidas,
        percentual:
          totalCartas > 0 ? Math.round((cartasObtidas / totalCartas) * 100) : 0,
      },
      jogador: {
        nome: usuario.nome,
        nivel: usuario.nivel ?? 1,
        rubys: usuario.saldo_rubys_cache ?? 0,
        avatarUrl: usuario.perfil?.avatar_url ?? null,
      },
    };
  }
}
