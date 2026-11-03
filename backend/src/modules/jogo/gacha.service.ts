import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { BannerRotacaoService } from './banner-rotacao.service';
import {
  giroGratuitoDisponivel,
  LIMITE_PITY,
  obterInicioJanelaGiroGratuito,
  obterProximoGiroGratuito,
  PROBABILIDADES_RARIDADE,
  type RaridadeGacha,
} from './gacha.config';
import { obterValorVendaPorRaridade } from './valor-venda-raridade';
import { calcularContadoresPity, lerConfiguracaoBanner, sortearRaridadeBanner } from './banner-configuracao';

const PESOS: Record<string, number> = { UR: 1, SSR: 3, SR: 8, R: 18, N: 35 };

@Injectable()
export class GachaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bannerRotacaoService: BannerRotacaoService,
  ) {}

  async listar(idUsuario: string) {
    await this.garantirBannerPadrao();
    const rotacao = await this.bannerRotacaoService.obterAtual();
    const [banners, usuario, horarioBanco] = await Promise.all([
      this.prisma.banner.findMany({
        where: rotacao ? { id: rotacao.idBanner, ativo: true } : { id: '' },
        include: {
          cartas: { include: { carta: true }, orderBy: { taxa_drop: 'asc' } },
          usuarioColetas: { where: { id_usuario: idUsuario }, take: 1 },
        },
        orderBy: { criado_em: 'asc' },
      }),
      this.prisma.usuario.findUniqueOrThrow({
        where: { id: idUsuario },
        select: {
          nome: true,
          nivel: true,
          saldo_rubys_cache: true,
        },
      }),
      this.prisma.$queryRaw<Array<{ agora: Date }>>(
        Prisma.sql`SELECT CURRENT_TIMESTAMP AS "agora"`,
      ),
    ]);

    const logs = await this.prisma.logGacha.findMany({
      where: {
        id_usuario: idUsuario,
        id_banner: { in: banners.map((b) => b.id) },
      },
      orderBy: { timestamp_pull: 'desc' },
      take: 10000,
      select: { id_banner: true, pity_contador: true, cartaObtida: { select: { raridade: true } } },
    });
    const agora = horarioBanco[0].agora.getTime();
    return {
      jogador: {
        nome: usuario.nome,
        nivel: usuario.nivel ?? 1,
        rubys: usuario.saldo_rubys_cache ?? 0,
      },
      rotacao: rotacao
        ? {
            bannerAtualId: rotacao.idBanner,
            proximaRotacaoEm: rotacao.proximaRotacaoEm,
            forcadoPorAdmin: rotacao.forcadoPorAdmin,
          }
        : null,
      probabilidades: banners[0] ? lerConfiguracaoBanner(banners[0].configuracao, banners[0].cartas.map((item) => item.carta.raridade)).chances : [],
      proximoGiroGratuitoEm: obterProximoGiroGratuito(agora),
      banners: banners.map((banner) => ({
        pities: calcularContadoresPity(
          lerConfiguracaoBanner(banner.configuracao, banner.cartas.map((item) => item.carta.raridade)).pities,
          logs.filter((log) => log.id_banner === banner.id).map((log) => log.cartaObtida.raridade),
        ),
        id: banner.id,
        nome: banner.nome,
        custoGiro: banner.custo_giro,
        custoDez: banner.custo_giro * 9,
        pity:
          logs.find((log) => log.id_banner === banner.id)?.pity_contador ?? 0,
        limitePity: LIMITE_PITY,
        diarioDisponivel: giroGratuitoDisponivel(
          banner.usuarioColetas[0]?.ultima_coleta,
          agora,
        ),
        cartas: banner.cartas.map(({ carta, taxa_drop }) => ({
          id: carta.id,
          nome: carta.nome,
          raridade: carta.raridade,
          elemento: carta.elemento,
          foto: carta.foto,
          moldura: carta.moldura,
          configVisual: carta.config_visual,
          taxaDrop: Number(taxa_drop),
        })),
      })),
    };
  }

  async girar(idUsuario: string, idBanner: string, quantidade: 1 | 10) {
    const atual = await this.bannerRotacaoService.obterAtual();
    if (atual?.idBanner !== idBanner) throw new ConflictException('Este banner não está disponível agora. Atualize a página.');
    return this.prisma.$transaction(
      async (tx) => {
        const [usuario, banner, ultimo] = await Promise.all([
          tx.usuario.findUnique({ where: { id: idUsuario } }),
          tx.banner.findFirst({
            where: { id: idBanner, ativo: true },
            include: { cartas: { include: { carta: true } } },
          }),
          tx.logGacha.findFirst({
            where: { id_usuario: idUsuario, id_banner: idBanner },
            orderBy: { timestamp_pull: 'desc' },
          }),
        ]);
        if (!usuario) throw new NotFoundException('Usuário não encontrado.');
        if (!banner || !banner.cartas.length)
          throw new NotFoundException('Banner indisponível.');
        const configuracao = lerConfiguracaoBanner(banner.configuracao, banner.cartas.map((item) => item.carta.raridade));
        const maiorLimite = Math.max(0, ...configuracao.pities.map((item) => item.limite));
        const historico = maiorLimite ? await tx.logGacha.findMany({ where: { id_usuario: idUsuario, id_banner: idBanner }, orderBy: { timestamp_pull: 'desc' }, take: maiorLimite, select: { cartaObtida: { select: { raridade: true } } } }) : [];
        let contadores = calcularContadoresPity(configuracao.pities, historico.map((item) => item.cartaObtida.raridade));
        const custo = banner.custo_giro * (quantidade === 10 ? 9 : 1);
        if ((usuario.saldo_rubys_cache ?? 0) < custo) {
          throw new BadRequestException('Rubys insuficientes.');
        }

        await tx.ledgerRuby.create({
          data: {
            id_usuario: idUsuario,
            quantidade: -custo,
            motivo: 'GIRO_BANNER',
            id_referencia: idBanner,
            descricao: `${quantidade} giro(s) em ${banner.nome}`,
          },
        });

        let pity = ultimo?.pity_contador ?? 0;
        const obtidas: Array<{
          id: string;
          nome: string;
          raridade: string;
          elemento: string;
          foto: string | null;
          moldura: string | null;
          configVisual: unknown;
          quantidade: number | null;
          nova: boolean;
          valorVenda: number;
        }> = [];
        let rubysGanhosDuplicatas = 0;
        for (let index = 0; index < quantidade; index += 1) {
          pity += 1;
          const garantida = [...contadores].filter((item) => item.atual + 1 >= item.limite).sort((a, b) => {
            const chanceA = configuracao.chances.find((chance) => chance.raridade === a.raridade)?.percentual ?? 100;
            const chanceB = configuracao.chances.find((chance) => chance.raridade === b.raridade)?.percentual ?? 100;
            return chanceA - chanceB || a.raridade.localeCompare(b.raridade);
          })[0];
          const raridade = garantida?.raridade ?? sortearRaridadeBanner(configuracao.chances, this.numeroAleatorio());
          const pool = banner.cartas.filter((item) => item.carta.raridade === raridade);
          if (!pool.length) throw new ConflictException('Banner sem cartas para a raridade sorteada.');
          const sorteada = this.sortear(pool);
          pity = sorteada.carta.raridade === 'UR' ? 0 : pity;
          contadores = contadores.map((item) => ({ ...item, atual: item.raridade === sorteada.carta.raridade ? 0 : Math.min(item.limite - 1, item.atual + 1) }));

          const inventarioAtual = await tx.inventario.findUnique({
            where: {
              id_usuario_id_carta: {
                id_usuario: idUsuario,
                id_carta: sorteada.id_carta,
              },
            },
          });
          const nova =
            !inventarioAtual || (inventarioAtual.quantidade ?? 0) < 1;
          const raridadeVenda = nova ? null : await tx.raridadeCarta.findUnique({ where: { codigo: sorteada.carta.raridade } });
          const valorVenda = nova ? 0 : (raridadeVenda?.valor_venda ?? obterValorVendaPorRaridade(sorteada.carta.raridade));
          const inventario = nova
            ? await tx.inventario.upsert({
                where: {
                  id_usuario_id_carta: {
                    id_usuario: idUsuario,
                    id_carta: sorteada.id_carta,
                  },
                },
                create: {
                  id_usuario: idUsuario,
                  id_carta: sorteada.id_carta,
                  quantidade: 1,
                },
                update: { quantidade: 1 },
              })
            : inventarioAtual;

          if (valorVenda > 0) {
            rubysGanhosDuplicatas += valorVenda;
            await tx.ledgerRuby.create({
              data: {
                id_usuario: idUsuario,
                quantidade: valorVenda,
                motivo: 'VENDA_CARTA_DUPLICADA',
                id_referencia: sorteada.id_carta,
                descricao: `Venda automática de ${sorteada.carta.nome}`,
              },
            });
          }
          await tx.logGacha.create({
            data: {
              id_usuario: idUsuario,
              id_banner: idBanner,
              id_carta_obtida: sorteada.id_carta,
              rubys_gastos: Math.max(1, Math.floor(custo / quantidade)),
              pity_contador: pity,
            },
          });
          obtidas.push({
            id: sorteada.carta.id,
            nome: sorteada.carta.nome,
            raridade: sorteada.carta.raridade,
            elemento: sorteada.carta.elemento,
            foto: sorteada.carta.foto,
            moldura: sorteada.carta.moldura,
            configVisual: sorteada.carta.config_visual,
            quantidade: inventario.quantidade,
            nova,
            valorVenda,
          });
        }

        return {
          cartas: obtidas,
          pity,
          pities: contadores,
          rubys:
            (usuario.saldo_rubys_cache ?? 0) - custo + rubysGanhosDuplicatas,
          custo,
          rubysGanhosDuplicatas,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async resgatarDiario(idUsuario: string, idBanner: string) {
    const atual = await this.bannerRotacaoService.obterAtual();
    if (atual?.idBanner !== idBanner) throw new ConflictException('Este banner não está disponível agora. Atualize a página.');
    return this.prisma.$transaction(
      async (tx) => {
        const [banner, horarioBanco] = await Promise.all([
          tx.banner.findFirst({ where: { id: idBanner, ativo: true } }),
          tx.$queryRaw<Array<{ agora: Date }>>(
            Prisma.sql`SELECT CURRENT_TIMESTAMP AS "agora"`,
          ),
        ]);
        if (!banner) throw new NotFoundException('Banner indisponível.');
        const agora = horarioBanco[0].agora;
        const inicioJanela = obterInicioJanelaGiroGratuito(agora.getTime());
        const coletasAtualizadas = await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO usuario_banner_coleta
              (id_usuario, id_banner, ultima_coleta)
            VALUES
              (${idUsuario}::uuid, ${idBanner}::uuid, ${agora})
            ON CONFLICT (id_usuario, id_banner)
            DO UPDATE SET ultima_coleta = EXCLUDED.ultima_coleta
            WHERE usuario_banner_coleta.ultima_coleta IS NULL
               OR usuario_banner_coleta.ultima_coleta < ${inicioJanela}
          `,
        );
        if (!coletasAtualizadas) {
          throw new ConflictException(
            'O giro gratuito ainda não está disponível.',
          );
        }
        await tx.ledgerRuby.create({
          data: {
            id_usuario: idUsuario,
            quantidade: banner.custo_giro,
            motivo: 'GIRO_BANNER',
            id_referencia: idBanner,
            descricao: 'Giro gratuito',
          },
        });
        return {
          message: 'Giro gratuito resgatado.',
          rubysRecebidos: banner.custo_giro,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private numeroAleatorio() {
    return randomInt(0, 1_000_000) / 1_000_000;
  }

  private sortear<T extends { taxa_drop: Prisma.Decimal }>(pool: T[]): T {
    const total = pool.reduce((soma, item) => soma + Number(item.taxa_drop), 0);
    let alvo = this.numeroAleatorio() * total;
    for (const item of pool) {
      alvo -= Number(item.taxa_drop);
      if (alvo <= 0) return item;
    }
    return pool[pool.length - 1];
  }

  private obterPoolSorteio<
    T extends { taxa_drop: Prisma.Decimal; carta: { raridade: string } },
  >(cartas: T[], forcarUr: boolean): T[] {
    if (forcarUr) {
      const cartasUr = cartas.filter(({ carta }) => carta.raridade === 'UR');
      if (cartasUr.length) return cartasUr;
    }

    const raridadeSorteada = this.sortearRaridade();
    const raridade = this.obterRaridadeDisponivel(cartas, raridadeSorteada);
    const poolRaridade = cartas.filter(
      ({ carta }) => carta.raridade === raridade,
    );
    return poolRaridade;
  }

  private sortearRaridade(): RaridadeGacha {
    let alvo = this.numeroAleatorio() * 100;

    for (const item of PROBABILIDADES_RARIDADE) {
      alvo -= item.percentual;
      if (alvo < 0) return item.raridade;
    }

    return 'N';
  }

  private obterRaridadeDisponivel<T extends { carta: { raridade: string } }>(
    cartas: T[],
    raridadeSorteada: RaridadeGacha,
  ): RaridadeGacha {
    const raridadesPresentes = new Set(
      cartas.map(({ carta }) => carta.raridade),
    );
    const ordem = PROBABILIDADES_RARIDADE.map((item) => item.raridade);
    const indice = ordem.indexOf(raridadeSorteada);

    for (let atual = indice; atual < ordem.length; atual += 1) {
      if (raridadesPresentes.has(ordem[atual])) return ordem[atual];
    }
    for (let atual = indice - 1; atual >= 0; atual -= 1) {
      if (raridadesPresentes.has(ordem[atual])) return ordem[atual];
    }

    throw new NotFoundException('Banner sem cartas disponíveis.');
  }

  private calcularProbabilidadesEfetivas<
    T extends { carta: { raridade: string } },
  >(cartas: T[]) {
    if (!cartas.length) return [];
    const totais = new Map<RaridadeGacha, number>();

    for (const item of PROBABILIDADES_RARIDADE) {
      const raridade = this.obterRaridadeDisponivel(cartas, item.raridade);
      totais.set(raridade, (totais.get(raridade) ?? 0) + item.percentual);
    }

    return PROBABILIDADES_RARIDADE.filter((item) =>
      totais.has(item.raridade),
    ).map((item) => ({
      raridade: item.raridade,
      percentual: totais.get(item.raridade) ?? 0,
    }));
  }

  private async garantirBannerPadrao() {
    if (await this.prisma.banner.count({ where: { ativo: true } })) return;
    const cartas = await this.prisma.carta.findMany({
      where: { ativo: true, excluido_em: null },
    });
    if (!cartas.length) return;
    const total = cartas.reduce(
      (soma, carta) => soma + (PESOS[carta.raridade] ?? 10),
      0,
    );
    await this.prisma.banner.create({
      data: {
        nome: 'Eclipse Roxo',
        custo_giro: 300,
        cartas: {
          create: cartas.map((carta) => ({
            id_carta: carta.id,
            taxa_drop: Math.max(
              0.01,
              Math.floor(((PESOS[carta.raridade] ?? 10) / total) * 9900) / 100,
            ),
          })),
        },
      },
    });
  }
}
