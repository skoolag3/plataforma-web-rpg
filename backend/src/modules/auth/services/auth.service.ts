import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { promises as dns } from 'dns';
import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { emailRegex } from '../dto/email.regex';
import { LoginDto } from '../dto/login.dto';
import { RedefinirSenhaDto } from '../dto/redefinir-senha.dto';
import { RegisterDto } from '../dto/register.dto';
import { ReenviarVerificacaoDto } from '../dto/reenviar-verificacao.dto';
import { SolicitarRedefinicaoSenhaDto } from '../dto/solicitar-redefinicao-senha.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import {
  revogarSessoesDoUsuario,
  revogarTokenEspecifico,
} from '../session-revocation';

const maxTentativasLogin = 5;
const janelaBloqueioLoginMs = 15 * 60 * 1000;
const tokenVerificacaoHoras = 24;
const tokenRedefinicaoSenhaHoras = 1;
const mensagemVerificacaoPendente =
  'Cadastro pendente de verificação. Tentamos enviar o e-mail; se o endereço existir, ele chegará em instantes.';
const mensagemReenvioPadrao =
  'Se o e-mail existir e estiver pendente de confirmação, enviaremos uma nova verificação.';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async registrar(data: RegisterDto) {
    const email = data.email.toLowerCase().trim();
    this.validarEmail(email);
    await this.validarEmailEntregavel(email);

    const userExiste = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (userExiste) {
      if (userExiste.excluido_em) {
        const identificador = userExiste.id.replaceAll('-', '');
        await this.prisma.$transaction([
          this.prisma.provedorUsuario.deleteMany({
            where: { id_usuario: userExiste.id },
          }),
          this.prisma.usuario.update({
            where: { id: userExiste.id },
            data: {
              email: `excluido-${identificador}@anon.invalid`,
              token_verificacao_email: null,
              token_verificacao_expira_em: null,
              token_redefinicao_senha: null,
              token_redefinicao_expira_em: null,
              email_pendente: null,
              token_confirmacao_troca_email: null,
              token_troca_email_expira_em: null,
              token_verificacao_email_pendente: null,
              token_email_pendente_expira_em: null,
            },
          }),
        ]);
      } else if (!userExiste.email_verificado) {
        const usuario = await this.atualizarTokenVerificacao(userExiste.id);
        await this.emailService.sendVerificationEmail({
          email: usuario.email,
          nome: usuario.nome,
          token: usuario.token_verificacao_email!,
        });

        return {
          message: mensagemVerificacaoPendente,
        };
      } else {
        throw new ConflictException('Já existe um usuário com este e-mail.');
      }
    }

    const tokenVerificacao = this.gerarTokenVerificacao();
    const senhaHash = await bcrypt.hash(data.senha, 10);
    let usuario: Usuario;
    try {
      usuario = await this.prisma.usuario.create({
        data: {
          nome: data.nome.trim(),
          email,
          senha_hash: senhaHash,
          senha_definida: true,
          email_verificado: false,
          token_verificacao_email: tokenVerificacao,
          token_verificacao_expira_em: this.gerarExpiracaoToken(),
          bloqueado: false,
          tentativas_login: 0,
        },
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        return { message: mensagemVerificacaoPendente };
      }
      throw erro;
    }

    await this.emailService.sendVerificationEmail({
      email: usuario.email,
      nome: usuario.nome,
      token: tokenVerificacao,
    });

    return {
      message: mensagemVerificacaoPendente,
      usuario: this.removerSenha(usuario),
    };
  }

  async verificarEmail(data: VerifyEmailDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { token_verificacao_email: data.token },
    });

    if (!usuario || !usuario.token_verificacao_expira_em) {
      throw new BadRequestException('Link de verificação inválido.');
    }

    if (usuario.token_verificacao_expira_em.getTime() < Date.now()) {
      throw new BadRequestException('Link de verificação expirado.');
    }

    const usuarioVerificado = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        email_verificado: true,
        token_verificacao_email: null,
        token_verificacao_expira_em: null,
        bloqueado: false,
        tentativas_login: 0,
      },
    });

    return {
      message: 'E-mail verificado com sucesso.',
      usuario: this.removerSenha(usuarioVerificado),
    };
  }

  async reenviarVerificacao(data: ReenviarVerificacaoDto) {
    const email = data.email.toLowerCase().trim();
    this.validarEmail(email);

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (
      !usuarioExistente ||
      usuarioExistente.email_verificado ||
      usuarioExistente.excluido_em
    ) {
      return {
        message: mensagemReenvioPadrao,
      };
    }

    const usuario = await this.atualizarTokenVerificacao(usuarioExistente.id);
    await this.emailService.sendVerificationEmail({
      email: usuario.email,
      nome: usuario.nome,
      token: usuario.token_verificacao_email!,
    });

    return {
      message: mensagemReenvioPadrao,
    };
  }

  async solicitarRedefinicaoSenha(data: SolicitarRedefinicaoSenhaDto) {
    const email = data.email.toLowerCase().trim();
    const mensagem =
      'Se o e-mail existir, enviaremos um link para alterar a senha.';
    this.validarEmail(email);
    await this.validarEmailEntregavel(email);

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario || usuario.excluido_em) {
      return { message: mensagem };
    }

    const usuarioComToken = await this.atualizarTokenRedefinicaoSenha(
      usuario.id,
    );

    await this.emailService.sendPasswordResetEmail({
      email: usuarioComToken.email,
      nome: usuarioComToken.nome,
      token: usuarioComToken.token_redefinicao_senha!,
    });

    return {
      message: mensagem,
    };
  }

  async redefinirSenha(data: RedefinirSenhaDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { token_redefinicao_senha: data.token },
    });

    if (!usuario || !usuario.token_redefinicao_expira_em) {
      throw new BadRequestException('Link de redefinição inválido.');
    }

    if (usuario.token_redefinicao_expira_em.getTime() < Date.now()) {
      throw new BadRequestException('Link de redefinição expirado.');
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha_hash: senhaHash,
        token_redefinicao_senha: null,
        token_redefinicao_expira_em: null,
        email_verificado: true,
        token_verificacao_email: null,
        token_verificacao_expira_em: null,
        bloqueado: false,
        tentativas_login: 0,
      },
    });

    revogarSessoesDoUsuario(usuario.id);

    return {
      message: 'Senha alterada com sucesso. Você já pode entrar.',
    };
  }

  async login(data: LoginDto) {
    const email = data.email.toLowerCase().trim();
    this.validarEmail(email);

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (usuario.excluido_em || usuario.ativo === false) {
      throw new ForbiddenException('Conta desativada ou excluida.');
    }

    if (usuario.bloqueado) {
      const bloqueioPorTentativas =
        (usuario.tentativas_login ?? 0) >= maxTentativasLogin;
      const ultimaAtualizacao = usuario.atualizado_em?.getTime() ?? 0;
      const bloqueioExpirado =
        bloqueioPorTentativas &&
        Date.now() - ultimaAtualizacao >= janelaBloqueioLoginMs;

      if (!bloqueioExpirado) {
        throw new ForbiddenException(
          bloqueioPorTentativas
            ? 'Conta temporariamente bloqueada por excesso de tentativas. Aguarde 15 minutos ou redefina sua senha.'
            : 'Conta bloqueada.',
        );
      }
    }

    if (!usuario.email_verificado) {
      throw new ForbiddenException('Verifique seu e-mail antes de entrar.');
    }

    const senhaValida = await bcrypt.compare(data.senha, usuario.senha_hash);

    if (!senhaValida) {
      const tentativasBase =
        usuario.bloqueado && (usuario.tentativas_login ?? 0) >= maxTentativasLogin
          ? 0
          : (usuario.tentativas_login ?? 0);
      const tentativas = tentativasBase + 1;
      const bloqueado = !usuario.is_admin && tentativas >= maxTentativasLogin;

      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          tentativas_login: tentativas,
          bloqueado,
          atualizado_em: new Date(),
        },
      });

      if (bloqueado) {
        throw new ForbiddenException(
          'Conta temporariamente bloqueada por excesso de tentativas. Aguarde 15 minutos ou redefina sua senha.',
        );
      }

      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const usuarioAtualizado =
      usuario.tentativas_login || usuario.bloqueado
        ? await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              tentativas_login: 0,
              bloqueado: false,
            },
          })
        : usuario;

    const usuarioComUltimoLogin = await this.prisma.usuario.update({
      where: { id: usuarioAtualizado.id },
      data: { ultimo_login_em: new Date() },
    });

    return {
      usuario: this.removerSenha(usuarioComUltimoLogin),
      access_token: this.gerarToken(usuarioComUltimoLogin),
    };
  }

  async criarSessaoOAuth(usuario: Usuario) {
    if (usuario.excluido_em || usuario.ativo === false) {
      throw new ForbiddenException('Conta desativada ou excluida.');
    }

    if (usuario.bloqueado) {
      throw new ForbiddenException('Conta bloqueada.');
    }

    const usuarioAtualizado = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ultimo_login_em: new Date(),
        tentativas_login: 0,
      },
    });

    return {
      usuario: this.removerSenha(usuarioAtualizado),
      access_token: this.gerarToken(usuarioAtualizado),
    };
  }

  async buscarPerfil(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    return usuario ? this.removerSenha(usuario) : null;
  }

  revogarTokenSessao(token: string | null) {
    if (!token) return;
    try {
      const payload = this.jwtService.verify<{ jti?: string; sub?: string }>(
        token,
      );
      if (payload?.jti) {
        revogarTokenEspecifico(payload.jti);
      } else if (payload?.sub) {
        revogarSessoesDoUsuario(payload.sub);
      }
    } catch {
      // Token já expirado ou inválido
    }
  }

  private gerarToken(usuario: Usuario) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      isAdmin: Boolean(usuario.is_admin),
      purpose: 'session',
      jti: randomBytes(16).toString('hex'),
    };

    return this.jwtService.sign(payload);
  }

  private validarEmail(email: string) {
    if (!emailRegex.test(email)) {
      throw new BadRequestException(
        'Digite um e-mail valido, sem caracteres especiais.',
      );
    }
  }

  private async validarEmailEntregavel(email: string) {
    if (!this.parseBoolean(process.env.EMAIL_VALIDATE_DELIVERY)) {
      return;
    }

    const domain = this.extrairDominioEmail(email);

    const domainStatus = await this.verificarDominioEmail(domain);

    if (domainStatus !== 'invalid') {
      return;
    }

    throw new BadRequestException('O domínio do e-mail não existe.');
  }

  private extrairDominioEmail(email: string) {
    const domain = email.split('@').pop()?.trim();

    if (!domain) {
      throw new BadRequestException('Digite um e-mail valido.');
    }

    return domain;
  }

  private async verificarDominioEmail(domain: string) {
    const mxRecords = await this.resolveDns(() => dns.resolveMx(domain));

    if (mxRecords.records?.some((record) => record.exchange)) {
      return 'valid';
    }

    const [ipv4Records, ipv6Records] = await Promise.all([
      this.resolveDns(() => dns.resolve4(domain)),
      this.resolveDns(() => dns.resolve6(domain)),
    ]);

    if (ipv4Records.records?.length || ipv6Records.records?.length) {
      return 'valid';
    }

    const codes = [mxRecords.code, ipv4Records.code, ipv6Records.code].filter(
      Boolean,
    );

    if (codes.length && codes.every((code) => this.isDnsMissingCode(code))) {
      return 'invalid';
    }

    return 'unknown';
  }

  private async resolveDns<T>(resolver: () => Promise<T>) {
    try {
      return { records: await resolver() };
    } catch (error) {
      const errorWithCode =
        typeof error === 'object' && error && 'code' in error
          ? (error as { code?: unknown })
          : null;

      return {
        records: null,
        code:
          typeof errorWithCode?.code === 'string' ||
          typeof errorWithCode?.code === 'number'
            ? String(errorWithCode.code)
            : undefined,
      };
    }
  }

  private isDnsMissingCode(code: string | undefined) {
    return code === 'ENOTFOUND' || code === 'ENODATA';
  }

  private gerarTokenVerificacao() {
    return randomBytes(32).toString('hex');
  }

  private gerarExpiracaoToken() {
    return new Date(Date.now() + tokenVerificacaoHoras * 60 * 60 * 1000);
  }

  private gerarExpiracaoTokenRedefinicaoSenha() {
    return new Date(Date.now() + tokenRedefinicaoSenhaHoras * 60 * 60 * 1000);
  }

  private atualizarTokenVerificacao(id: string) {
    return this.prisma.usuario.update({
      where: { id },
      data: {
        token_verificacao_email: this.gerarTokenVerificacao(),
        token_verificacao_expira_em: this.gerarExpiracaoToken(),
      },
    });
  }

  private atualizarTokenRedefinicaoSenha(id: string) {
    return this.prisma.usuario.update({
      where: { id },
      data: {
        token_redefinicao_senha: this.gerarTokenVerificacao(),
        token_redefinicao_expira_em: this.gerarExpiracaoTokenRedefinicaoSenha(),
      },
    });
  }

  private removerSenha(usuario: Usuario) {
    const usuarioSemSenha: Partial<Usuario> = { ...usuario };

    delete usuarioSemSenha.senha_hash;
    delete usuarioSemSenha.token_verificacao_email;
    delete usuarioSemSenha.token_redefinicao_senha;
    delete usuarioSemSenha.email_pendente;
    delete usuarioSemSenha.token_confirmacao_troca_email;
    delete usuarioSemSenha.token_troca_email_expira_em;
    delete usuarioSemSenha.token_verificacao_email_pendente;
    delete usuarioSemSenha.token_email_pendente_expira_em;

    return this.formatarDatasBrasil(usuarioSemSenha);
  }

  private formatarDatasBrasil<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value instanceof Date ? this.formatarDataBrasil(value) : value,
      ]),
    );
  }

  private formatarDataBrasil(data: Date) {
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

  private parseBoolean(value: string | undefined) {
    if (value === undefined) {
      return null;
    }

    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }
}
