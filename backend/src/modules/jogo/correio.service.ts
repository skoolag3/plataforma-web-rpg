import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BannerRotacaoService } from './banner-rotacao.service';
import {
  giroGratuitoDisponivel,
  obterInicioJanelaGiroGratuito,
  obterProximoGiroGratuito,
} from './gacha.config';
import {
  obterInicioSemana,
  obterProximaRecompensaSemanal,
  RECOMPENSA_SEMANAL_RUBYS,
  recompensaSemanalDisponivel,
} from './recompensas.config';

type ItemCorreio = {
  chave: string;
  tipo: 'RECOMPENSA' | 'EVENTO' | 'PROMOCAO' | 'AVISO' | 'NOVIDADE';
  titulo: string;
  resumo: string;
  href: string;
  acao: string;
  criadoEm: Date;
  expiraEm: Date | null;
  lida: boolean;
};

@Injectable()
export class CorreioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bannerRotacaoService: BannerRotacaoService,
  ) {}

  async listar(idUsuario: string) {
    const agora = Date.now();
    const rotacao = await this.bannerRotacaoService.obterAtual();
    const [usuario, banner, noticias, leituras] = await Promise.all([
      this.prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: { ultima_recompensa_semanal_em: true },
      }),
      rotacao
        ? this.prisma.banner.findFirst({
            where: { id: rotacao.idBanner, ativo: true },
            select: {
              usuarioColetas: {
                where: { id_usuario: idUsuario },
                take: 1,
                select: { ultima_coleta: true },
              },
            },
          })
        : null,
      this.prisma.noticia.findMany({
        where: { publicada: true },
        orderBy: { criado_em: 'desc' },
        take: 5,
        select: {
          id: true,
          titulo: true,
          resumo: true,
          categoria: true,
          criado_em: true,
        },
      }),
      this.prisma.correioLeitura.findMany({
        where: { id_usuario: idUsuario },
        select: { chave: true },
      }),
    ]);
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');

    const chavesLidas = new Set(leituras.map((item) => item.chave));
    const itens: ItemCorreio[] = [];
    const ultimaColeta = banner?.usuarioColetas[0]?.ultima_coleta;

    if (rotacao && giroGratuitoDisponivel(ultimaColeta, agora)) {
      const inicio = obterInicioJanelaGiroGratuito(agora);
      itens.push({
        chave: `giro:${inicio.toISOString()}`,
        tipo: 'RECOMPENSA',
        titulo: 'Giro gratuito disponível',
        resumo: 'Seu giro gratuito já pode ser resgatado no portal do gacha.',
        href: '/gacha',
        acao: 'Ir para o gacha',
        criadoEm: inicio,
        expiraEm: obterProximoGiroGratuito(agora),
        lida: chavesLidas.has(`giro:${inicio.toISOString()}`),
      });
    }

    if (
      recompensaSemanalDisponivel(usuario.ultima_recompensa_semanal_em, agora)
    ) {
      const inicio = obterInicioSemana(agora);
      itens.push({
        chave: `semanal:${inicio.toISOString()}`,
        tipo: 'RECOMPENSA',
        titulo: 'Recompensa semanal disponível',
        resumo: `${RECOMPENSA_SEMANAL_RUBYS} Rubys estão esperando seu resgate.`,
        href: '/gacha',
        acao: 'Resgatar no gacha',
        criadoEm: inicio,
        expiraEm: obterProximaRecompensaSemanal(agora),
        lida: chavesLidas.has(`semanal:${inicio.toISOString()}`),
      });
    }

    for (const noticia of noticias) {
      const chave = `noticia:${noticia.id}`;
      const tipo = ['EVENTO', 'PROMOCAO', 'AVISO', 'NOVIDADE'].includes(
        noticia.categoria,
      )
        ? (noticia.categoria as ItemCorreio['tipo'])
        : 'NOVIDADE';
      itens.push({
        chave,
        tipo,
        titulo: noticia.titulo,
        resumo: noticia.resumo,
        href: `/noticias/${noticia.id}`,
        acao: 'Ler comunicado',
        criadoEm: noticia.criado_em,
        expiraEm: null,
        lida: chavesLidas.has(chave),
      });
    }

    itens.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
    return {
      naoLidas: itens.filter((item) => !item.lida).length,
      itens,
    };
  }

  async marcarComoLida(idUsuario: string, chave: string) {
    await this.prisma.correioLeitura.upsert({
      where: { id_usuario_chave: { id_usuario: idUsuario, chave } },
      create: { id_usuario: idUsuario, chave },
      update: { lido_em: new Date() },
    });
    return { message: 'Mensagem marcada como lida.' };
  }
}
