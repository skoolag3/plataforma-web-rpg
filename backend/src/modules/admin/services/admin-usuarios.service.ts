import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateAdminUsuarioDto } from '../dto/admin-usuario.dto';

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
  constructor(private readonly prisma: PrismaService) { }

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

  async atualizar(id: string, dto: UpdateAdminUsuarioDto) {
    const atual = await this.buscar(id);
    if (atual.admin && (dto.bloqueado === true || dto.ativo === false)) {
      throw new BadRequestException(
        'Contas administrativas não podem ser bloqueadas ou inativadas.',
      );
    }
    const usuario = await this.prisma.usuario.update({
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

    return this.toResponse(usuario);
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
