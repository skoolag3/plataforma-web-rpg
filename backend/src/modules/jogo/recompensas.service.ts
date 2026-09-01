import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  obterInicioSemana,
  obterProximaRecompensaSemanal,
  RECOMPENSA_SEMANAL_RUBYS,
  recompensaSemanalDisponivel,
} from './recompensas.config';

@Injectable()
export class RecompensasService {
  constructor(private readonly prisma: PrismaService) {}

  async obterStatus(idUsuario: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: {
        ultima_recompensa_semanal_em: true,
        saldo_rubys_cache: true,
      },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');

    const agora = Date.now();
    return {
      semanal: {
        disponivel: recompensaSemanalDisponivel(
          usuario.ultima_recompensa_semanal_em,
          agora,
        ),
        rubys: RECOMPENSA_SEMANAL_RUBYS,
        proximaRenovacaoEm: obterProximaRecompensaSemanal(agora),
      },
      saldoRubys: usuario.saldo_rubys_cache ?? 0,
    };
  }

  async resgatarSemanal(idUsuario: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const agora = new Date();
        const inicioSemana = obterInicioSemana(agora.getTime());
        const atualizacao = await tx.usuario.updateMany({
          where: {
            id: idUsuario,
            OR: [
              { ultima_recompensa_semanal_em: null },
              { ultima_recompensa_semanal_em: { lt: inicioSemana } },
            ],
          },
          data: { ultima_recompensa_semanal_em: agora },
        });

        if (!atualizacao.count) {
          const existe = await tx.usuario.findUnique({
            where: { id: idUsuario },
            select: { id: true },
          });
          if (!existe) throw new NotFoundException('Usuário não encontrado.');
          throw new ConflictException('A recompensa semanal já foi resgatada.');
        }

        await tx.ledgerRuby.create({
          data: {
            id_usuario: idUsuario,
            quantidade: RECOMPENSA_SEMANAL_RUBYS,
            motivo: 'RECOMPENSA_SEMANAL',
            descricao: 'Recompensa semanal.',
          },
        });

        return {
          message: 'Recompensa semanal resgatada.',
          rubysRecebidos: RECOMPENSA_SEMANAL_RUBYS,
          proximaRenovacaoEm: obterProximaRecompensaSemanal(agora.getTime()),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
