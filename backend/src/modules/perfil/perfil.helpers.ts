import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { PrismaService } from '../../database/prisma.service';
import type { SelecionarMolduraDto } from './dto/selecionar-moldura.dto';

export function formatarIdUsuario(id: string) {
  return `#AOD-${id.replaceAll('-', '').slice(-4).toUpperCase()}`;
}

export function formatarDataBrasil(data: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(data)
    .replace(',', '');
}

export async function validarSenhaPerfil(senhaHash: string, senha: string) {
  if (!(await bcrypt.compare(senha, senhaHash))) {
    throw new UnauthorizedException('Senha atual incorreta.');
  }
}

export async function executarExclusoesPendentes(prisma: PrismaService) {
  const solicitacoes = await prisma.solicitacaoExclusao.findMany({
    where: {
      status: 'AGENDADA',
      executar_apos: { lte: new Date() },
    },
    select: { id: true, id_usuario: true },
    take: 100,
  });

  for (const solicitacao of solicitacoes) {
    const identificador = solicitacao.id_usuario.replaceAll('-', '');
    const senhaAleatoria = await bcrypt.hash(
      randomBytes(48).toString('hex'),
      10,
    );

    await prisma.$transaction([
      prisma.provedorUsuario.deleteMany({
        where: { id_usuario: solicitacao.id_usuario },
      }),
      prisma.perfilUsuario.updateMany({
        where: { id_usuario: solicitacao.id_usuario },
        data: {
          biografia: '',
          avatar_url: null,
          banner_url: null,
          receber_notificacoes: false,
          mostrar_no_ranking: false,
          ocultar_historico: true,
        },
      }),
      prisma.usuario.update({
        where: { id: solicitacao.id_usuario },
        data: {
          nome: 'Usuário excluído',
          email: `excluido-${identificador}@anon.invalid`,
          senha_hash: senhaAleatoria,
          email_verificado: false,
          token_verificacao_email: null,
          token_verificacao_expira_em: null,
          token_redefinicao_senha: null,
          token_redefinicao_expira_em: null,
          email_pendente: null,
          token_confirmacao_troca_email: null,
          token_troca_email_expira_em: null,
          token_verificacao_email_pendente: null,
          token_email_pendente_expira_em: null,
          ativo: false,
          excluido_em: new Date(),
          exclusao_agendada_em: null,
        },
      }),
      prisma.solicitacaoExclusao.update({
        where: { id: solicitacao.id },
        data: { status: 'EXECUTADA', executada_em: new Date() },
      }),
    ]);
  }
}

export async function consultarMoldurasUsuario(
  prisma: PrismaService,
  idUsuario: string,
) {
  const [molduras, cartasComMoldura] = await Promise.all([
    prisma.moldura.findMany({
      where: { ativo: true, slug: { notIn: ['padrao', 'violeta', 'rubi'] } },
      include: {
        usuarios: {
          where: { id_usuario: idUsuario },
          select: { id_usuario: true },
        },
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.carta.findMany({
      where: {
        ativo: true,
        excluido_em: null,
        moldura: { not: null },
      },
      include: {
        inventarios: {
          where: {
            id_usuario: idUsuario,
            quantidade: { gt: 0 },
          },
          select: { id: true },
        },
      },
      orderBy: { nome: 'asc' },
    }),
  ]);

  return [
    {
      id: 'padrao',
      nome: 'Padrão',
      descricao: 'Moldura inicial do perfil.',
      classeCss: 'molduraPadrao',
      imagemUrl: null,
      obtida: true,
    },
    ...molduras.map((moldura) => ({
      id: moldura.id,
      nome: moldura.nome,
      descricao: moldura.descricao,
      classeCss: moldura.classe_css,
      imagemUrl: null,
      obtida: moldura.usuarios.length > 0,
    })),
    ...cartasComMoldura.flatMap((carta) =>
      carta.moldura
        ? [
            {
              id: `carta:${carta.id}`,
              nome: `Moldura de ${carta.nome}`,
              descricao: `Obtida com a carta ${carta.nome}.`,
              classeCss: 'molduraCarta',
              imagemUrl: carta.moldura,
              configVisual: carta.config_visual,
              requisito: `Obtenha a carta ${carta.nome}.`,
              obtida: carta.inventarios.length > 0,
            },
          ]
        : [],
    ),
  ];
}


export async function aplicarFotoCartaPerfil(
  prisma: PrismaService,
  idUsuario: string,
  idCarta: string,
) {
  if (idCarta === 'padrao') {
    await prisma.perfilUsuario.upsert({
      where: { id_usuario: idUsuario },
      create: { id_usuario: idUsuario, avatar_url: null },
      update: { avatar_url: null },
    });
    return { message: 'Foto padrão selecionada.', avatarUrl: null };
  }

  const item = await prisma.inventario.findFirst({
    where: {
      id_usuario: idUsuario,
      id_carta: idCarta,
      quantidade: { gt: 0 },
      carta: {
        ativo: true,
        excluido_em: null,
        OR: [{ foto_perfil: { not: null } }, { foto: { not: null } }],
      },
    },
    select: { carta: { select: { foto: true, foto_perfil: true } } },
  });
  const url = item?.carta?.foto_perfil ?? item?.carta?.foto;
  if (!url) {
    throw new ForbiddenException(
      'Esta foto não está disponível na sua coleção.',
    );
  }
  await prisma.perfilUsuario.upsert({
    where: { id_usuario: idUsuario },
    create: { id_usuario: idUsuario, avatar_url: url },
    update: { avatar_url: url },
  });
  return { message: 'Foto do perfil atualizada.', avatarUrl: url };
}

export async function aplicarMolduraPerfil(
  prisma: PrismaService,
  idUsuario: string,
  dto: SelecionarMolduraDto,
) {
  if (dto.idMoldura === 'padrao') {
    await prisma.perfilUsuario.upsert({
      where: { id_usuario: idUsuario },
      create: {
        id_usuario: idUsuario,
        id_moldura: null,
        id_carta_moldura: null,
      },
      update: { id_moldura: null, id_carta_moldura: null },
    });
    return {
      message: 'Moldura padrão selecionada.',
      moldura: 'Padrão',
      molduraClasse: 'molduraPadrao',
      molduraUrl: null,
      molduraConfig: null,
    };
  }

  if (dto.idMoldura.startsWith('carta:')) {
    const idCarta = dto.idMoldura.slice('carta:'.length);
    const item = await prisma.inventario.findFirst({
      where: {
        id_usuario: idUsuario,
        id_carta: idCarta,
        quantidade: { gt: 0 },
        carta: {
          is: {
            ativo: true,
            excluido_em: null,
            moldura: { not: null },
          },
        },
      },
      include: { carta: true },
    });

    if (!item?.carta?.moldura) {
      throw new ForbiddenException(
        'Obtenha esta carta antes de usar a moldura dela.',
      );
    }

    await prisma.perfilUsuario.upsert({
      where: { id_usuario: idUsuario },
      create: {
        id_usuario: idUsuario,
        id_moldura: null,
        id_carta_moldura: idCarta,
      },
      update: { id_moldura: null, id_carta_moldura: idCarta },
    });

    return {
      message: 'Moldura da carta selecionada.',
      moldura: `Moldura de ${item.carta.nome}`,
      molduraClasse: 'molduraCarta',
      molduraUrl: item.carta.moldura,
      molduraConfig: item.carta.config_visual,
    };
  }

  const posse = await prisma.usuarioMoldura.findUnique({
    where: {
      id_usuario_id_moldura: {
        id_usuario: idUsuario,
        id_moldura: dto.idMoldura,
      },
    },
    include: { moldura: true },
  });

  if (!posse) {
    throw new ForbiddenException('Esta moldura não pertence ao jogador.');
  }

  await prisma.perfilUsuario.upsert({
    where: { id_usuario: idUsuario },
    create: {
      id_usuario: idUsuario,
      id_moldura: dto.idMoldura,
      id_carta_moldura: null,
    },
    update: { id_moldura: dto.idMoldura, id_carta_moldura: null },
  });

  return {
    message: 'Moldura selecionada.',
    moldura: posse.moldura.nome,
    molduraClasse: posse.moldura.classe_css,
    molduraUrl: null,
    molduraConfig: null,
  };
}
