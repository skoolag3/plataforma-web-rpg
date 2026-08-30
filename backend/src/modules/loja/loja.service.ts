import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LojaService {
  private readonly stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
  constructor(private readonly prisma: PrismaService) {}

  async pacotes() {
    let pacotes = await this.prisma.pacoteRuby.findMany({ where: { ativo: true }, orderBy: { preco_brl: 'asc' } });
    if (!pacotes.length) {
      await this.prisma.pacoteRuby.createMany({ data: [
        { id_stripe: 'rubys_leve', nome: 'Pacote Leve', quantidade_rubys: 500, preco_brl: 4.90 },
        { id_stripe: 'rubys_medio', nome: 'Pacote Médio', quantidade_rubys: 1400, preco_brl: 9.90 },
        { id_stripe: 'rubys_grande', nome: 'Pacote Grande', quantidade_rubys: 3200, preco_brl: 19.90 },
      ] });
      pacotes = await this.prisma.pacoteRuby.findMany({ where: { ativo: true }, orderBy: { preco_brl: 'asc' } });
    }
    return pacotes;
  }

  async criarCheckout(idUsuario: string, idPacote: string) {
    if (!this.stripe) throw new BadRequestException('Stripe não configurado no servidor.');
    const pacote = await this.prisma.pacoteRuby.findFirst({ where: { id: idPacote, ativo: true } });
    if (!pacote) throw new BadRequestException('Pacote de Rubys indisponível.');
    const transacao = await this.prisma.logTransacao.create({ data: { id_usuario: idUsuario, id_pacote: pacote.id, valor_brl: pacote.preco_brl, status_pagamento: 'PENDENTE' } });
    const sessao = await this.stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price_data: { currency: 'brl', product_data: { name: pacote.nome }, unit_amount: Math.round(Number(pacote.preco_brl) * 100) }, quantity: 1 }], success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/gacha?pagamento=sucesso`, cancel_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/gacha?pagamento=cancelado`, metadata: { transacaoId: transacao.id, usuarioId: idUsuario } });
    await this.prisma.logTransacao.update({ where: { id: transacao.id }, data: { id_stripe_intent: sessao.id } });
    return { url: sessao.url };
  }

  async webhook(payload: Buffer, assinatura: string | undefined) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) throw new UnauthorizedException('Webhook Stripe não configurado.');
    const evento = this.stripe.webhooks.constructEvent(payload, assinatura ?? '', process.env.STRIPE_WEBHOOK_SECRET);
    if (evento.type !== 'checkout.session.completed') return { recebido: true };
    const sessao = evento.data.object as Stripe.Checkout.Session;
    const idTransacao = sessao.metadata?.transacaoId;
    if (!idTransacao) return { recebido: true };
    await this.prisma.$transaction(async (tx) => {
      const transacao = await tx.logTransacao.findUnique({ where: { id: idTransacao }, include: { pacote: true } });
      if (!transacao || transacao.status_pagamento === 'APROVADO' || !transacao.id_usuario || !transacao.pacote) return;
      await tx.logTransacao.update({ where: { id: transacao.id }, data: { status_pagamento: 'APROVADO' } });
      await tx.usuario.update({ where: { id: transacao.id_usuario }, data: { saldo_rubys_cache: { increment: transacao.pacote.quantidade_rubys } } });
      await tx.ledgerRuby.create({ data: { id_usuario: transacao.id_usuario, quantidade: transacao.pacote.quantidade_rubys, motivo: 'COMPRA_STRIPE', id_referencia: transacao.id, descricao: `Compra aprovada: ${transacao.pacote.nome}.` } });
    });
    return { recebido: true };
  }
}
