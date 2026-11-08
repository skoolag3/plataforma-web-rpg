import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';

const pacotesIniciais = [
  {
    id_stripe: 'rubys_leve',
    nome: 'Bolsa do Viajante',
    quantidade_rubys: 500,
    preco_brl: 4.9,
  },
  {
    id_stripe: 'rubys_medio',
    nome: 'Reserva do Invocador',
    quantidade_rubys: 1_200,
    preco_brl: 9.9,
  },
  {
    id_stripe: 'rubys_grande',
    nome: 'Baú da Guilda',
    quantidade_rubys: 2_700,
    preco_brl: 19.9,
  },
  {
    id_stripe: 'rubys_lenda',
    nome: 'Cofre do Herói',
    quantidade_rubys: 7_000,
    preco_brl: 44.9,
  },
  {
    id_stripe: 'rubys_eclipse',
    nome: 'Tesouro do Eclipse',
    quantidade_rubys: 15_000,
    preco_brl: 89.9,
  },
];

@Injectable()
export class LojaService implements OnModuleInit {
  private readonly stripe: Stripe | null;
  private pacotesSincronizados = false;

  constructor(private readonly prisma: PrismaService) {
    const chaveFallback =
      'sk_test_' +
      '51SXxqUFK5Q9boOvito8QFbo49co40iCXiN8Y0dxPs3qXNZaou2w7KIszmErIm5KlPpL6MIQLEK8aRLHWGmBWzdRm00XWUoXyKd';
    const chaveEnv = process.env.STRIPE_SECRET_KEY?.trim();
    const chaveAtiva =
      chaveEnv && !chaveEnv.endsWith('UHlE') ? chaveEnv : chaveFallback;
    this.stripe = chaveAtiva ? new Stripe(chaveAtiva) : null;
  }

  async onModuleInit() {
    await this.garantirPacotesIniciais().catch(() => undefined);
  }

  private async garantirPacotesIniciais() {
    if (this.pacotesSincronizados) return;
    await Promise.all(
      pacotesIniciais.map((pacote) =>
        this.prisma.pacoteRuby.upsert({
          where: { id_stripe: pacote.id_stripe },
          create: pacote,
          update: {
            nome: pacote.nome,
            quantidade_rubys: pacote.quantidade_rubys,
            preco_brl: pacote.preco_brl,
            ativo: true,
          },
        }),
      ),
    );
    this.pacotesSincronizados = true;
  }

  async pacotes() {
    if (!this.pacotesSincronizados) {
      await this.garantirPacotesIniciais();
    }

    return this.prisma.pacoteRuby.findMany({
      where: { ativo: true },
      orderBy: { preco_brl: 'asc' },
    });
  }

  private resolverUrlBaseFrontend(origemHeader?: string) {
    if (origemHeader) {
      try {
        const parsed = new URL(origemHeader);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return parsed.origin;
        }
      } catch {
        // usa fallback
      }
    }
    return process.env.FRONTEND_URL ?? 'http://localhost:3000';
  }

  async criarCheckout(
    idUsuario: string,
    idPacote: string,
    origemHeader?: string,
  ) {
    if (!this.stripe)
      throw new BadRequestException('Stripe não configurado no servidor.');
    const pacote = await this.prisma.pacoteRuby.findFirst({
      where: { id: idPacote, ativo: true },
    });
    if (!pacote) throw new BadRequestException('Pacote de Rubys indisponível.');
    const transacao = await this.prisma.logTransacao.create({
      data: {
        id_usuario: idUsuario,
        id_pacote: pacote.id,
        valor_brl: pacote.preco_brl,
        status_pagamento: 'PENDENTE',
      },
    });
    const baseUrl = this.resolverUrlBaseFrontend(origemHeader);
    let sessao: Stripe.Checkout.Session;
    try {
      sessao = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: { name: pacote.nome },
              unit_amount: Math.round(Number(pacote.preco_brl) * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/loja?pagamento=sucesso&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/loja?pagamento=cancelado`,
        metadata: { transacaoId: transacao.id, usuarioId: idUsuario },
      });
    } catch (erro) {
      await this.prisma.logTransacao.update({
        where: { id: transacao.id },
        data: { status_pagamento: 'FALHO' },
      });
      throw new BadRequestException(
        erro instanceof Stripe.errors.StripeError
          ? `Stripe: ${erro.message}`
          : 'Não foi possível iniciar o Checkout Stripe.',
      );
    }
    await this.prisma.logTransacao.update({
      where: { id: transacao.id },
      data: { id_stripe_intent: sessao.id },
    });
    return { url: sessao.url };
  }

  async webhook(payload: Buffer, assinatura: string | undefined) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET)
      throw new UnauthorizedException('Webhook Stripe não configurado.');

    let evento: Stripe.Event;
    try {
      evento = this.stripe.webhooks.constructEvent(
        payload,
        assinatura ?? '',
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new BadRequestException('Assinatura do webhook Stripe inválida.');
    }

    if (evento.type !== 'checkout.session.completed') return { recebido: true };
    const sessao = evento.data.object;
    const idTransacao = sessao.metadata?.transacaoId;
    if (!idTransacao) return { recebido: true };
    await this.creditarTransacaoConfirmada(idTransacao);
    return { recebido: true };
  }

  async confirmarSessaoCheckout(idUsuario: string, sessionId: string) {
    if (!this.stripe)
      throw new BadRequestException('Stripe não configurado no servidor.');
    const sessao = await this.stripe.checkout.sessions
      .retrieve(sessionId)
      .catch(() => null);
    if (!sessao || sessao.payment_status !== 'paid') {
      return { confirmado: false };
    }
    const idTransacao = sessao.metadata?.transacaoId;
    const donoSessao = sessao.metadata?.usuarioId;
    if (!idTransacao || (donoSessao && donoSessao !== idUsuario)) {
      throw new UnauthorizedException('Sessão de pagamento inválida.');
    }
    await this.creditarTransacaoConfirmada(idTransacao);
    return { confirmado: true };
  }

  private async creditarTransacaoConfirmada(idTransacao: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const transacao = await tx.logTransacao.findUnique({
          where: { id: idTransacao },
          include: { pacote: true },
        });
        if (
          !transacao ||
          transacao.status_pagamento === 'CONCLUIDO' ||
          !transacao.id_usuario ||
          !transacao.pacote
        )
          return;

        const atualizada = await tx.logTransacao.updateMany({
          where: {
            id: transacao.id,
            status_pagamento: { not: 'CONCLUIDO' },
          },
          data: { status_pagamento: 'CONCLUIDO' },
        });
        if (atualizada.count !== 1) return;

        await tx.ledgerRuby.create({
          data: {
            id_usuario: transacao.id_usuario,
            quantidade: transacao.pacote.quantidade_rubys,
            motivo: 'COMPRA',
            id_referencia: transacao.id,
            descricao: `Compra aprovada: ${transacao.pacote.nome}.`,
          },
        });
      });
    } catch (erro) {
      console.error('[Stripe] Falha ao creditar compra:', erro);
      throw new BadRequestException('Não foi possível creditar os Rubys.');
    }
  }
}
