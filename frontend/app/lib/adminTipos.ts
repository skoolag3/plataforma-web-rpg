import type { ConfigVisualCarta } from "../components/cartaMontada";

export type TipoEfeitoHabilidade =
  | "BUFF"
  | "DEBUFF"
  | "DANO"
  | "CURA"
  | "ESCUDO"
  | "ROUBO_VIDA"
  | "EVASAO"
  | "CRITICO";

export type AdminHabilidade = {
  id: string;
  nome: string;
  descricao: string | null;
  modoExecucao: "AUTOMATICA";
  tipoEfeito: TipoEfeitoHabilidade;
  gatilho:
    | "AO_ENTRAR"
    | "AO_ATACAR"
    | "AO_RECEBER_DANO"
    | "INICIO_TURNO"
    | "FIM_TURNO";
  alvo: "PROPRIA_CARTA" | "ALIADO_ATIVO" | "INIMIGO_ATIVO";
  atributo: "ATAQUE" | "DEFESA" | "VELOCIDADE" | null;
  unidade: "FIXO" | "PERCENTUAL";
  valorBase: number;
  formaAplicacao: "ANTES_ACAO" | "APOS_ACAO" | "SUBSTITUI_ATAQUE";
  requisitoTipo: "NENHUM" | "CHANCE" | "CONTADOR_ATAQUES" | "HP_ABAIXO" | "TURNO_MINIMO" | "INTERVALO_TURNOS";
  requisitoValor: number | null;
  escalaTipo: "NENHUMA" | "POR_TURNO" | "POR_ATAQUE";
  escalaValor: number | null;
  escalaLimite: number | null;
  duracaoTurnos: number | null;
  status: "RASCUNHO" | "PUBLICADA" | "INATIVA";
  versao: number;
  testadaEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type SalvarAdminHabilidadePayload = {
  nome: string;
  descricao?: string;
  tipoEfeito: AdminHabilidade["tipoEfeito"];
  gatilho: AdminHabilidade["gatilho"];
  alvo: AdminHabilidade["alvo"];
  atributo?: Exclude<AdminHabilidade["atributo"], null>;
  unidade: AdminHabilidade["unidade"];
  valorBase: number;
  formaAplicacao: AdminHabilidade["formaAplicacao"];
  requisitoTipo: AdminHabilidade["requisitoTipo"];
  requisitoValor?: number;
  escalaTipo: AdminHabilidade["escalaTipo"];
  escalaValor?: number;
  escalaLimite?: number;
  duracaoTurnos?: number;
};

export type TestarAdminHabilidadePayload = {
  criticoAtivou?: boolean;
  turno: number;
  ataquesRealizados: number;
  hpAtual: number;
  hpMaximo: number;
};

export type ResultadoTesteAdminHabilidade = {
  habilidade: AdminHabilidade;
  resultado: {
    acionada: boolean;
    requisitoAtendido: boolean;
    valorCalculado: number;
    percentualHp: number;
    resumo: string;
  };
};

export type AdminCarta = {
  id: string;
  nome: string;
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  raridade: string;
  classe: string | null;
  idClasse: string | null;
  classeDetalhes: AdminClasse | null;
  custo: number | null;
  hpBase: number;
  danoBase: number;
  defesaBase: number;
  passiva: Record<string, unknown>;
  foto: string | null;
  fotoPerfil: string | null;
  moldura: string | null;
  configVisual: ConfigVisualCarta | null;
  ativo: boolean;
  excluidoEm?: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
  habilidades: AdminCartaHabilidade[];
};

export type AdminCartaHabilidade = {
  id: string;
  nome: string;
  descricao: string | null;
  tipoEfeito: TipoEfeitoHabilidade;
  gatilho: AdminHabilidade["gatilho"];
  alvo: AdminHabilidade["alvo"];
  status: AdminHabilidade["status"];
  versao: number;
  ordem: number;
};

export type CreateAdminCartaPayload = {
  nome: string;
  elemento: AdminCarta["elemento"];
  raridade: AdminCarta["raridade"];
  classe?: string;
  idClasse?: string | null;
  custo?: number;
  hpBase: number;
  danoBase: number;
  defesaBase: number;
  passiva?: Record<string, unknown>;
  foto?: string;
  fotoPerfil?: string;
  moldura?: string;
  configVisual?: ConfigVisualCarta;
  ativo?: boolean;
  habilidadesIds?: string[];
};

export type UpdateAdminCartaPayload = Omit<Partial<CreateAdminCartaPayload>, "foto" | "fotoPerfil" | "moldura"> & {
  confirmarImpacto?: boolean;
  foto?: string | null;
  fotoPerfil?: string | null;
  moldura?: string | null;
};

export type AdminCartaImpacto = {
  usuariosComCarta: number;
};

export type AdminCartaHistorico = {
  id: string;
  idCarta: string;
  nomeCarta: string;
  acao: "CRIADA" | "ALTERADA" | "REMOVIDA" | "RESTAURADA";
  alteracoes: Record<string, { antes: unknown; depois: unknown }> | null;
  criadoEm: string;
  autor: { nome: string; email: string } | null;
};

export type AdminCartasHistoricoPainel = {
  registros: AdminCartaHistorico[];
  paginacao: { pagina: number; porPagina: number; total: number; totalPaginas: number };
};

export type AdminClasse = {
  id: string;
  nome: string;
  descricao: string | null;
  prioridadeAtaque: number;
  ativo: boolean;
  totalCartas: number;
};

export type SalvarAdminClassePayload = {
  nome: string;
  descricao?: string;
  prioridadeAtaque: number;
  ativo?: boolean;
};

export type AdminRaridade = {
  codigo: string;
  nome: string;
  valorVenda: number;
  cor: string;
  ordem: number;
  totalCartas: number;
};

export type SalvarAdminRaridadePayload = { nome: string; valorVenda: number; cor: string };

export type AdminUsuario = {
  id: string;
  nome: string;
  email: string;
  nivel: number;
  partidas: number;
  rubys: number;
  ativo: boolean;
  bloqueado: boolean;
  admin: boolean;
  emailVerificado: boolean;
  criadoEm: string | null;
  ultimoLoginEm: string | null;
  avatarUrl: string | null;
  molduraId: string | null;
  molduraClasse?: string;
  molduraUrl?: string | null;
  molduraConfig?: ConfigVisualCarta | null;
};

export type UpdateAdminUsuarioPayload = {
  nome?: string;
  nivel?: number;
  ativo?: boolean;
  bloqueado?: boolean;
  emailVerificado?: boolean;
  admin?: boolean;
};

export type AdminUsuarioCarta = {
  id: string;
  nome: string;
  raridade: string;
  elemento: string;
  foto: string | null;
  moldura: string | null;
  configVisual: ConfigVisualCarta | null;
  quantidade: number;
};

export type AdminUsuarioAtividade = {
  id: string;
  tipo: "RUBY" | "COMPRA" | "GACHA" | "ADMIN";
  titulo: string;
  descricao: string | null;
  valor: number | null;
  unidade: "RUBYS" | "BRL" | null;
  natureza: "ENTRADA" | "SAIDA" | "NEUTRO";
  criadoEm: string | null;
  autoria: { id: string; nome: string; email: string } | null;
  detalhes: Record<string, unknown> | null;
};

export type AdminUsuarioExpedicao = {
  id: string;
  deck: string;
  status: string;
  etapaAtual: number;
  rubys: number;
  criadoEm: string;
  finalizadoEm: string | null;
  lutas: AdminUsuarioLuta[];
};

export type AdminUsuarioLuta = {
  id: string;
  etapa: number | null;
  resultado: string;
  turnos: number;
  rubys: number;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
};

export type AdminUsuarioLogLuta = AdminUsuarioLuta & {
  eventos: {
    id: string;
    sequencia: number;
    turno: number;
    tipo: string;
    origem: string | null;
    texto: string;
    valor: number | null;
    criadoEm: string;
  }[];
};

export type AdminUsuarioExpedicoesPagina = {
  itens: AdminUsuarioExpedicao[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

export type AjusteSaldoUsuarioPayload = {
  rubys: number;
  motivo: string;
};

export type PeriodoDashboardAdmin = "7d" | "30d" | "tudo";

export type AdminDashboardResumo = {
  periodo: PeriodoDashboardAdmin;
  metricas: {
    usuarios: number;
    usuariosAtivos: number;
    usuariosBloqueados: number;
    usuariosNaoVerificados: number;
    usuariosNovosPeriodo: number;
    usuariosLoginPeriodo: number;
    cartas: number;
    cartasAtivas: number;
    partidas: number;
    partidasPeriodo: number;
    rubysEmCirculacao: number;
  };
  combate: {
    partidasPeriodo: number;
    vitorias: number;
    derrotas: number;
    abandonosPartida: number;
    taxaVitoria: number;
    mediaTurnos: number;
    rubysRecompensados: number;
    expedicoes: {
      total: number;
      ativas: number;
      concluidas: number;
      falhas: number;
      abandonadas: number;
      taxaConclusao: number;
    };
  };
  economia: {
    rubysEmCirculacao: number;
    rubysEmitidosPeriodo: number;
    rubysConsumidosPeriodo: number;
    saldoLiquidoPeriodo: number;
    girosGachaPeriodo: number;
    rubysGastosGachaPeriodo: number;
    pityMedio: number;
    comprasPagasPeriodo: number;
    receitaBrlPeriodo: number;
    bannersMaisGirados: {
      id: string;
      nome: string;
      ativo: boolean;
      giros: number;
      rubysGastos: number;
    }[];
  };
  saudeCatalogo: {
    cartasSemHabilidade: number;
    nomesSemHabilidade?: string[];
    cartasForaDeBanner: number;
    nomesForaDeBanner?: string[];
    habilidadesRascunho: number;
    nomesSkillsRascunho?: string[];
    habilidadesNaoTestadas: number;
    bannersAtivos: number;
    noticiasPublicadas: number;
    noticiasRascunho: number;
  };
  alertas: {
    id: string;
    severidade: "critico" | "atencao" | "ok";
    pergunta: string;
    resposta: string;
    acaoLabel: string;
    href: string;
  }[];
  raridades: { raridade: AdminCarta["raridade"] | string; total: number }[];
  atividadeRecente: {
    tipo: string;
    texto: string;
    data: string | null;
    status: string;
    detalhe: string;
  }[];
  topCartas: {
    id: string | null;
    nome: string;
    raridade: string;
    elemento?: string;
    quantidade: number;
  }[];
  topDecks: {
    id: string | null;
    nome: string;
    raridade: string;
    elemento?: string;
    decks: number;
  }[];
};

export type AdminLogPityGacha = {
  id: string;
  pityContador: number;
  limitePityBanner: number | null;
  foiPityGarantido: boolean;
  rubysGastos: number;
  dataHora: string | null;
  jogador: {
    id: string;
    nome: string;
    email: string;
    avatarUrl: string | null;
  };
  banner: {
    id: string;
    nome: string;
  };
  carta: {
    id: string;
    nome: string;
    raridade: string;
    elemento: string;
    foto: string | null;
    moldura: string | null;
    configVisual: unknown;
  };
};

export type AnexoNoticia = { titulo: string; url: string };

export type AdminNoticia = {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem: string | null;
  categoria: "NOVIDADE" | "BALANCE" | "EVENTO" | "PROMOCAO" | "AVISO";
  anexos: AnexoNoticia[] | null;
  publicada: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type SalvarAdminNoticiaPayload = Omit<
  AdminNoticia,
  "id" | "criado_em" | "atualizado_em" | "anexos" | "imagem"
> & {
  anexos: AnexoNoticia[];
  imagem?: string;
};

export type UploadedAsset = {
  url: string;
  publicId: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
};

export type UploadCartaAssetsResponse = {
  foto: UploadedAsset | null;
  fotoPerfil: UploadedAsset | null;
  moldura: UploadedAsset | null;
};

export type ProbabilidadeGacha = {
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  percentual: number;
};

export type AdminBanner = {
  id: string;
  nome: string;
  custoGiro: number;
  ativo: boolean;
  totalCartas: number;
  cartas: Pick<AdminCarta, "id" | "nome" | "raridade" | "elemento">[];
  raridades: { raridade: string; total: number }[];
  chances: { raridade: string; percentual: number }[];
  pities: { raridade: string; limite: number }[];
  inicioEm: string | null;
  fimEm: string | null;
};

export type SalvarAdminBannerPayload = {
  nome: string;
  custoGiro: number;
  ativo: boolean;
  cartasIds: string[];
  chances: { raridade: string; percentual: number }[];
  pities: { raridade: string; limite: number }[];
  inicioEm: string | null;
  fimEm: string | null;
};

export type AdminBannersResponse = {
  probabilidades: ProbabilidadeGacha[];
  raridadesDisponiveis: { codigo: string; nome: string; cor: string }[];
  rotacao: {
    bannerAtualId: string;
    proximaRotacaoEm: string | null;
    forcadoPorAdmin: boolean;
  } | null;
  banners: AdminBanner[];
};

export type AdminCampanhaConfiguracao = {
  ativa: boolean;
  recompensaFacil: number;
  recompensaMedia: number;
  recompensaDificil: number;
  recompensaChefe: number;
  percentualMantidoDerrota: number;
  atualizadoEm: string;
};

export type AdminCampanhaPainel = {
  configuracao: AdminCampanhaConfiguracao;
  boss: AdminBoss;
  produtos: AdminProdutoExpedicao[];
  temas: { nome: string }[];
  cartas: { id: string; nome: string }[];
};

export type CaminhoCampanha = {
  dificuldade: "FACIL" | "MEDIA" | "DIFICIL";
  recompensa: number;
  cartas: string[];
  quantidadeCartas?: number;
  modoCartas?: "ALEATORIO" | "MANUAL";
  mixed?: boolean;
  titulo?: string;
  descricao?: string;
};

export type SecaoCampanha =
  | { tipo: "BATALHA"; caminhos: CaminhoCampanha[]; grupo?: number; percentualMantidoDerrota?: number }
  | { tipo: "BOSS"; percentualMantidoDerrota?: number };

export type AdminExpedicoesPainel = {
  metricas: {
    total: number;
    ativas: number;
    concluidas: number;
    falhas: number;
    abandonadas: number;
  };
  paginacao: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };
  expedicoes: {
    id: string;
    jogador: string;
    email: string;
    deck: string;
    status: string;
    etapaAtual: number;
    rubys: number;
    criadoEm: string;
    finalizadoEm: string | null;
  }[];
};

export type AdminProdutoExpedicao = {
  id: string;
  nome: string;
  descricao: string;
  tema: string;
  tipo: "RECORRENTE" | "EVENTO";
  ativo: boolean;
  peso: number;
  inicioEm: string | null;
  fimEm: string | null;
  recompensaFacil: number;
  recompensaMedia: number;
  recompensaDificil: number;
  recompensaChefe: number;
  percentualMantidoDerrota: number;
  bossNome: string;
  bossPersonalidade: string;
  bossProvocacao: string;
  bossPerguntas: string[];
  bossCartas: string[];
  secoes: SecaoCampanha[];
  criadoEm: string;
  atualizadoEm: string;
};

export type SalvarProdutoExpedicaoPayload = Omit<
  AdminProdutoExpedicao,
  "id" | "criadoEm" | "atualizadoEm"
>;

export type AdminBoss = {
  nome: string;
  personalidade: string;
  provocacao: string;
  perguntas: string[];
  cartas: string[];
};
