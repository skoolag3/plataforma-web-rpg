export type TipoEfeitoHabilidade =
  | 'BUFF'
  | 'DEBUFF'
  | 'DANO'
  | 'CURA'
  | 'ESCUDO'
  | 'ROUBO_VIDA'
  | 'EVASAO';

export type GatilhoHabilidade =
  | 'AO_ENTRAR'
  | 'AO_ATACAR'
  | 'AO_RECEBER_DANO'
  | 'INICIO_TURNO'
  | 'FIM_TURNO';

export type AlvoHabilidade = 'PROPRIA_CARTA' | 'ALIADO_ATIVO' | 'INIMIGO_ATIVO';

export type AtributoHabilidade = 'ATAQUE' | 'DEFESA' | 'VELOCIDADE';
export type UnidadeHabilidade = 'FIXO' | 'PERCENTUAL';

export type FormaAplicacaoHabilidade =
  | 'ANTES_ACAO'
  | 'APOS_ACAO'
  | 'SUBSTITUI_ATAQUE';

export type StatusHabilidade = 'RASCUNHO' | 'PUBLICADA' | 'INATIVA';

export type RequisitoHabilidade =
  | { tipo: 'NENHUM' }
  | { tipo: 'CONTADOR_ATAQUES'; quantidade: number }
  | { tipo: 'HP_ABAIXO'; percentual: number }
  | { tipo: 'TURNO_MINIMO'; turno: number };

export type EscalaHabilidade =
  | { tipo: 'NENHUMA' }
  | {
      tipo: 'POR_TURNO' | 'POR_ATAQUE';
      valor: number;
      limite: number;
    };

export type ConfiguracaoHabilidade = {
  nome: string;
  descricao?: string;
  modoExecucao: 'AUTOMATICA';
  tipoEfeito: TipoEfeitoHabilidade;
  gatilho: GatilhoHabilidade;
  alvo: AlvoHabilidade;
  atributo?: AtributoHabilidade;
  unidade: UnidadeHabilidade;
  valorBase: number;
  formaAplicacao: FormaAplicacaoHabilidade;
  requisito: RequisitoHabilidade;
  escala: EscalaHabilidade;
  duracaoTurnos?: number;
  status: StatusHabilidade;
};

export type ErroValidacaoHabilidade = {
  campo: string;
  codigo: string;
  mensagem: string;
};

export type ResultadoValidacaoHabilidade = {
  valida: boolean;
  erros: ErroValidacaoHabilidade[];
};
