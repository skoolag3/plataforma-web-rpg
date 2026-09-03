export type Dificuldade = 'FACIL' | 'MEDIA' | 'DIFICIL' | 'CHEFE';
export type Lado = 'JOGADOR' | 'BOT';
export type AcaoTurno = 'ATACAR' | 'DEFENDER';

export type CartaBatalhaBase = {
  id: string;
  nome: string;
  hp: number;
  ataque: number;
  defesa: number;
  velocidade: number;
  elemento: string;
  passiva?: Record<string, unknown>;
};

type ModificadorTemporario = {
  atributo: 'ATAQUE' | 'DEFESA' | 'VELOCIDADE';
  valor: number;
  expiraNoTurno: number;
};

type EstadoHabilidades = {
  ataquesRealizados: number;
  escudo: number;
  escudoExpiraNoTurno: number | null;
  modificadores: ModificadorTemporario[];
};

export type CartaBatalha = CartaBatalhaBase & {
  hpAtual: number;
  ataqueAtual: number;
  defesaAtual: number;
  velocidadeAtual: number;
  derrotada: boolean;
};

export type EventoBatalha = {
  turno: number;
  tipo:
    | 'ENTRADA'
    | 'BUFF'
    | 'DEBUFF'
    | 'ATAQUE'
    | 'DEFESA'
    | 'DANO'
    | 'CURA'
    | 'ESCUDO'
    | 'EVASAO'
    | 'HABILIDADE'
    | 'DERROTA'
    | 'FIM';
  texto: string;
  origem?: Lado;
  valor?: number;
};

export type EstadoBatalha = {
  turno: number;
  status: 'EM_ANDAMENTO' | 'FINALIZADA';
  vencedor: Lado | 'EMPATE' | null;
  jogador: { cartas: CartaBatalha[]; ativa: number };
  bot: { cartas: CartaBatalha[]; ativa: number };
  eventos: EventoBatalha[];
};

const multiplicadorDificuldade: Record<Dificuldade, number> = {
  FACIL: 0.86,
  MEDIA: 1,
  DIFICIL: 1.18,
  CHEFE: 1.35,
};

export function analisarResposta(resposta: string): Dificuldade {
  const texto = resposta.trim().toLocaleLowerCase('pt-BR');
  const confianca = [
    'vou vencer',
    'sem medo',
    'derrotar',
    'acabar com',
    'pronto',
    'desafio',
  ];
  const receio = ['medo', 'desisto', 'não sei', 'nao sei', 'talvez', 'perder'];
  const pontos =
    Math.min(2, Math.floor(texto.length / 45)) +
    confianca.filter((termo) => texto.includes(termo)).length -
    receio.filter((termo) => texto.includes(termo)).length;
  return pontos >= 2 ? 'DIFICIL' : pontos <= 0 ? 'FACIL' : 'MEDIA';
}

export function iniciarBatalha(
  jogador: CartaBatalhaBase[],
  bot: CartaBatalhaBase[],
  dificuldade: Dificuldade,
): EstadoBatalha {
  const montar = (cartas: CartaBatalhaBase[], multiplicador = 1) =>
    cartas.map((carta) => ({
      ...carta,
      hp: Math.max(1, Math.round(carta.hp * multiplicador)),
      ataque: Math.max(1, Math.round(carta.ataque * multiplicador)),
      defesa: Math.max(0, Math.round(carta.defesa * multiplicador)),
      velocidade: Math.max(1, Math.round(carta.velocidade)),
      hpAtual: Math.max(1, Math.round(carta.hp * multiplicador)),
      ataqueAtual: Math.max(1, Math.round(carta.ataque * multiplicador)),
      defesaAtual: Math.max(0, Math.round(carta.defesa * multiplicador)),
      velocidadeAtual: Math.max(1, Math.round(carta.velocidade)),
      derrotada: false,
    }));
  const estado: EstadoBatalha = {
    turno: 0,
    status: 'EM_ANDAMENTO',
    vencedor: null,
    jogador: { cartas: montar(jogador), ativa: 0 },
    bot: {
      cartas: montar(bot, multiplicadorDificuldade[dificuldade]),
      ativa: 0,
    },
    eventos: [],
  };
  aplicarEntrada(estado, 'JOGADOR');
  aplicarEntrada(estado, 'BOT');
  return estado;
}

export function executarTurno(
  estado: EstadoBatalha,
  acao: AcaoTurno = 'ATACAR',
): EstadoBatalha {
  if (estado.status === 'FINALIZADA') return estado;

  estado.turno += 1;
  for (const lado of ['JOGADOR', 'BOT'] as Lado[]) {
    removerModificadoresExpirados(estado, lado);
    acionarHabilidades(estado, lado, 'INICIO_TURNO');
  }

  if (acao === 'DEFENDER') {
    estado.eventos.push({
      turno: estado.turno,
      tipo: 'DEFESA',
      origem: 'JOGADOR',
      texto: `${cartaAtiva(estado, 'JOGADOR').nome} assumiu postura defensiva.`,
    });
    atacar(estado, 'BOT', 'JOGADOR', { reducaoDano: 0.55 });
    finalizarTurno(estado);
    return estado;
  }

  const jogadorPrimeiro =
    cartaAtiva(estado, 'JOGADOR').velocidadeAtual <=
    cartaAtiva(estado, 'BOT').velocidadeAtual;
  const ordem: Lado[] = jogadorPrimeiro
    ? ['JOGADOR', 'BOT']
    : ['BOT', 'JOGADOR'];
  for (const lado of ordem) {
    if (estado.vencedor) break;
    const alvo = lado === 'JOGADOR' ? 'BOT' : 'JOGADOR';
    if (!cartaAtiva(estado, lado).derrotada) atacar(estado, lado, alvo);
  }
  finalizarTurno(estado);
  return estado;
}

function atacar(
  estado: EstadoBatalha,
  origem: Lado,
  alvo: Lado,
  modificadores: { reducaoDano?: number } = {},
) {
  const atacante = cartaAtiva(estado, origem);
  const defensor = cartaAtiva(estado, alvo);
  aplicarPassivaAtaque(estado, origem, alvo);
  const habilidadeAntes = acionarHabilidades(
    estado,
    origem,
    'AO_ATACAR',
    'ANTES_ACAO',
  );
  const defesaAntes = acionarHabilidades(
    estado,
    alvo,
    'AO_RECEBER_DANO',
    'ANTES_ACAO',
  );
  if (
    estado.status === 'FINALIZADA' ||
    atacante.derrotada ||
    defensor.derrotada
  ) {
    return;
  }
  const danoBase = atacante.ataqueAtual - defensor.defesaAtual * 0.45;
  let dano = Math.max(
    1,
    Math.round(
      danoBase *
        (habilidadeAntes.multiplicadorAtaque ?? 1) *
        (1 - (modificadores.reducaoDano ?? 0)),
    ),
  );
  if (defesaAntes.evadiu) dano = 0;
  dano = absorverComEscudo(defensor, dano);
  defensor.hpAtual = Math.max(0, defensor.hpAtual - dano);
  estado.eventos.push(
    {
      turno: estado.turno,
      tipo: 'ATAQUE',
      origem,
      texto: `${atacante.nome} atacou ${defensor.nome}.`,
    },
    {
      turno: estado.turno,
      tipo: 'DANO',
      origem,
      valor: dano,
      texto: `${defensor.nome} recebeu ${dano} de dano.`,
    },
  );
  obterEstadoHabilidades(atacante).ataquesRealizados += 1;
  acionarHabilidades(estado, alvo, 'AO_RECEBER_DANO', 'APOS_ACAO', dano);
  acionarHabilidades(estado, origem, 'AO_ATACAR', 'APOS_ACAO', dano);
  if (defensor.hpAtual === 0) derrotar(estado, alvo);
}

function derrotar(estado: EstadoBatalha, lado: Lado) {
  const equipe = lado === 'JOGADOR' ? estado.jogador : estado.bot;
  const derrotada = equipe.cartas[equipe.ativa];
  derrotada.derrotada = true;
  estado.eventos.push({
    turno: estado.turno,
    tipo: 'DERROTA',
    texto: `${derrotada.nome} foi derrotada.`,
  });
  const proxima = equipe.cartas.findIndex(
    (carta, indice) => indice > equipe.ativa && !carta.derrotada,
  );
  if (proxima < 0) {
    estado.status = 'FINALIZADA';
    estado.vencedor = lado === 'JOGADOR' ? 'BOT' : 'JOGADOR';
    estado.eventos.push({
      turno: estado.turno,
      tipo: 'FIM',
      texto: `${estado.vencedor} venceu a partida.`,
    });
  } else {
    equipe.ativa = proxima;
    aplicarEntrada(estado, lado);
  }
}

function aplicarEntrada(estado: EstadoBatalha, lado: Lado) {
  const carta = cartaAtiva(estado, lado);
  estado.eventos.push({
    turno: estado.turno,
    tipo: 'ENTRADA',
    origem: lado,
    texto: `${carta.nome} entrou em campo.`,
  });
  const passiva = carta.passiva ?? {};
  if (passiva.gatilho === 'on_enter') {
    const alvo =
      passiva.alvo === 'enemy'
        ? lado === 'JOGADOR'
          ? 'BOT'
          : 'JOGADOR'
        : lado;
    aplicarModificador(estado, lado, alvo, passiva);
  }
  acionarHabilidades(estado, lado, 'AO_ENTRAR');
}

function aplicarPassivaAtaque(estado: EstadoBatalha, lado: Lado, alvo: Lado) {
  const passiva = cartaAtiva(estado, lado).passiva ?? {};
  if (passiva.gatilho === 'on_attack')
    aplicarModificador(
      estado,
      lado,
      passiva.alvo === 'enemy' ? alvo : lado,
      passiva,
    );
}

function aplicarModificador(
  estado: EstadoBatalha,
  origem: Lado,
  alvo: Lado,
  passiva: Record<string, unknown>,
) {
  const carta = cartaAtiva(estado, alvo);
  const valor = typeof passiva.valor === 'number' ? passiva.valor : 0;
  const fator = passiva.tipo === 'debuff' ? -1 : 1;
  const atributo =
    passiva.atributo === 'defesa' || passiva.atributo === 'velocidade'
      ? passiva.atributo
      : 'ataque';
  const chave: 'ataqueAtual' | 'defesaAtual' | 'velocidadeAtual' =
    atributo === 'defesa'
      ? 'defesaAtual'
      : atributo === 'velocidade'
        ? 'velocidadeAtual'
        : 'ataqueAtual';
  carta[chave] = Math.max(1, carta[chave] + fator * valor);
  const tipo = fator > 0 ? 'BUFF' : 'DEBUFF';
  estado.eventos.push({
    turno: estado.turno,
    tipo,
    origem,
    valor,
    texto: `${carta.nome}: ${atributo} ${fator > 0 ? '+' : '-'}${valor}.`,
  });
}

function finalizarTurno(estado: EstadoBatalha) {
  if (estado.status === 'FINALIZADA') return;
  for (const lado of ['JOGADOR', 'BOT'] as Lado[]) {
    acionarHabilidades(estado, lado, 'FIM_TURNO');
  }
}

function acionarHabilidades(
  estado: EstadoBatalha,
  origem: Lado,
  gatilho: GatilhoHabilidade,
  fase?: 'ANTES_ACAO' | 'APOS_ACAO',
  danoCausado = 0,
) {
  const res: { multiplicadorAtaque?: number; evadiu?: boolean } = {};
  const dono = cartaAtiva(estado, origem);
  const habilidades = obterHabilidades(dono).filter(
    (habilidade) =>
      habilidade.status === 'PUBLICADA' &&
      habilidade.gatilho === gatilho &&
      (!fase ||
        habilidade.formaAplicacao === fase ||
        (fase === 'ANTES_ACAO' &&
          habilidade.formaAplicacao === 'SUBSTITUI_ATAQUE')),
  );

  for (const habilidade of habilidades) {
    if (!requisitoAtendido(habilidade, dono, estado.turno)) continue;
    const valor = calcularValorHabilidade(habilidade, dono, estado.turno);
    const alvo = obterAlvoHabilidade(estado, origem, habilidade);

    if (
      habilidade.tipoEfeito === 'DANO' &&
      habilidade.formaAplicacao === 'SUBSTITUI_ATAQUE'
    ) {
      res.multiplicadorAtaque =
        habilidade.unidade === 'PERCENTUAL' ? valor / 100 : 1;
      registrarAtivacao(estado, origem, habilidade, valor);
      continue;
    }
    if (habilidade.tipoEfeito === 'EVASAO') {
      const chance = Math.min(95, valor) / 100;
      if (Math.random() < chance) {
        res.evadiu = true;
        estado.eventos.push({
          turno: estado.turno,
          tipo: 'EVASAO',
          origem,
          valor,
          texto: `${alvo.nome} ativou ${habilidade.nome} e evitou o dano.`,
        });
      }
      continue;
    }
    aplicarEfeitoHabilidade(
      estado,
      origem,
      alvo,
      habilidade,
      valor,
      danoCausado,
    );
  }
  return res;
}

function aplicarEfeitoHabilidade(
  estado: EstadoBatalha,
  origem: Lado,
  alvo: CartaBatalha,
  habilidade: ConfiguracaoHabilidade,
  valor: number,
  danoCausado: number,
) {
  if (habilidade.tipoEfeito === 'CURA') {
    const cura = calcularValorAplicado(valor, habilidade.unidade, alvo.hp);
    const recuperado = Math.min(cura, alvo.hp - alvo.hpAtual);
    alvo.hpAtual += recuperado;
    estado.eventos.push({
      turno: estado.turno,
      tipo: 'CURA',
      origem,
      valor: recuperado,
      texto: `${alvo.nome} ativou ${habilidade.nome} e recuperou ${recuperado} de HP.`,
    });
    return;
  }
  if (habilidade.tipoEfeito === 'ROUBO_VIDA') {
    const cura = Math.round((danoCausado * valor) / 100);
    const recuperado = Math.min(cura, alvo.hp - alvo.hpAtual);
    alvo.hpAtual += recuperado;
    estado.eventos.push({
      turno: estado.turno,
      tipo: 'CURA',
      origem,
      valor: recuperado,
      texto: `${alvo.nome} ativou ${habilidade.nome} e drenou ${recuperado} de HP.`,
    });
    return;
  }
  if (habilidade.tipoEfeito === 'ESCUDO') {
    const estadoAlvo = obterEstadoHabilidades(alvo);
    const escudo = calcularValorAplicado(valor, habilidade.unidade, alvo.hp);
    estadoAlvo.escudo += escudo;
    estadoAlvo.escudoExpiraNoTurno = habilidade.duracaoTurnos
      ? estado.turno + habilidade.duracaoTurnos
      : null;
    estado.eventos.push({
      turno: estado.turno,
      tipo: 'ESCUDO',
      origem,
      valor: escudo,
      texto: `${alvo.nome} ativou ${habilidade.nome} e recebeu ${escudo} de escudo.`,
    });
    return;
  }
  if (habilidade.tipoEfeito === 'DANO') {
    const dano = calcularValorAplicado(valor, habilidade.unidade, alvo.hp);
    alvo.hpAtual = Math.max(0, alvo.hpAtual - dano);
    estado.eventos.push({
      turno: estado.turno,
      tipo: 'DANO',
      origem,
      valor: dano,
      texto: `${habilidade.nome} causou ${dano} de dano em ${alvo.nome}.`,
    });
    const ladoAlvo = obterLadoCarta(estado, alvo);
    if (alvo.hpAtual === 0 && ladoAlvo && !alvo.derrotada) {
      derrotar(estado, ladoAlvo);
    }
    return;
  }
  if (
    (habilidade.tipoEfeito === 'BUFF' || habilidade.tipoEfeito === 'DEBUFF') &&
    habilidade.atributo
  ) {
    aplicarAlteracaoAtributo(estado, origem, alvo, habilidade, valor);
  }
}

function aplicarAlteracaoAtributo(
  estado: EstadoBatalha,
  origem: Lado,
  alvo: CartaBatalha,
  habilidade: ConfiguracaoHabilidade,
  valor: number,
) {
  const atributo = habilidade.atributo!;
  const chaveAtual =
    atributo === 'DEFESA'
      ? 'defesaAtual'
      : atributo === 'VELOCIDADE'
        ? 'velocidadeAtual'
        : 'ataqueAtual';
  const chaveBase =
    atributo === 'DEFESA'
      ? 'defesa'
      : atributo === 'VELOCIDADE'
        ? 'velocidade'
        : 'ataque';
  const alteracao = calcularValorAplicado(
    valor,
    habilidade.unidade,
    alvo[chaveBase],
  );
  const fator = habilidade.tipoEfeito === 'DEBUFF' ? -1 : 1;
  alvo[chaveAtual] = Math.max(1, alvo[chaveAtual] + alteracao * fator);
  if (habilidade.duracaoTurnos) {
    obterEstadoHabilidades(alvo).modificadores.push({
      atributo,
      valor: alteracao * fator,
      expiraNoTurno: estado.turno + habilidade.duracaoTurnos,
    });
  }
  estado.eventos.push({
    turno: estado.turno,
    tipo: habilidade.tipoEfeito === 'BUFF' ? 'BUFF' : 'DEBUFF',
    origem,
    valor: alteracao,
    texto: `${alvo.nome} ativou ${habilidade.nome}: ${atributo.toLowerCase()} ${fator > 0 ? '+' : '-'}${alteracao}.`,
  });
}

function removerModificadoresExpirados(estado: EstadoBatalha, lado: Lado) {
  const carta = cartaAtiva(estado, lado);
  const runtime = obterEstadoHabilidades(carta);
  if (
    runtime.escudoExpiraNoTurno !== null &&
    runtime.escudoExpiraNoTurno <= estado.turno
  ) {
    runtime.escudo = 0;
    runtime.escudoExpiraNoTurno = null;
  }
  const expirados = runtime.modificadores.filter(
    (efeito) => efeito.expiraNoTurno <= estado.turno,
  );
  for (const efeito of expirados) {
    const chave =
      efeito.atributo === 'DEFESA'
        ? 'defesaAtual'
        : efeito.atributo === 'VELOCIDADE'
          ? 'velocidadeAtual'
          : 'ataqueAtual';
    carta[chave] = Math.max(1, carta[chave] - efeito.valor);
  }
  runtime.modificadores = runtime.modificadores.filter(
    (efeito) => efeito.expiraNoTurno > estado.turno,
  );
}

function absorverComEscudo(carta: CartaBatalha, dano: number) {
  const runtime = obterEstadoHabilidades(carta);
  const absorvido = Math.min(runtime.escudo, dano);
  runtime.escudo -= absorvido;
  return dano - absorvido;
}

function obterHabilidades(carta: CartaBatalha) {
  const habilidades = carta.passiva?.habilidades;
  return Array.isArray(habilidades)
    ? (habilidades as ConfiguracaoHabilidade[])
    : [];
}

function obterEstadoHabilidades(carta: CartaBatalha): EstadoHabilidades {
  const passiva = (carta.passiva ??= {});
  const salvo = passiva.estadoHabilidades;
  if (salvo && typeof salvo === 'object' && !Array.isArray(salvo)) {
    const runtime = salvo as Partial<EstadoHabilidades>;
    runtime.ataquesRealizados = Number(runtime.ataquesRealizados) || 0;
    runtime.escudo = Number(runtime.escudo) || 0;
    runtime.escudoExpiraNoTurno = Number.isFinite(runtime.escudoExpiraNoTurno)
      ? Number(runtime.escudoExpiraNoTurno)
      : null;
    runtime.modificadores = Array.isArray(runtime.modificadores)
      ? runtime.modificadores
      : [];
    return runtime as EstadoHabilidades;
  }
  const runtime: EstadoHabilidades = {
    ataquesRealizados: 0,
    escudo: 0,
    escudoExpiraNoTurno: null,
    modificadores: [],
  };
  passiva.estadoHabilidades = runtime;
  return runtime;
}

function requisitoAtendido(
  habilidade: ConfiguracaoHabilidade,
  carta: CartaBatalha,
  turno: number,
) {
  const requisito = habilidade.requisito;
  if (requisito.tipo === 'CONTADOR_ATAQUES') {
    return (
      obterEstadoHabilidades(carta).ataquesRealizados >= requisito.quantidade
    );
  }
  if (requisito.tipo === 'HP_ABAIXO') {
    return (carta.hpAtual / carta.hp) * 100 < requisito.percentual;
  }
  if (requisito.tipo === 'TURNO_MINIMO') return turno >= requisito.turno;
  return true;
}

function calcularValorHabilidade(
  habilidade: ConfiguracaoHabilidade,
  carta: CartaBatalha,
  turno: number,
) {
  if (habilidade.escala.tipo === 'NENHUMA') return habilidade.valorBase;
  const multiplicador =
    habilidade.escala.tipo === 'POR_TURNO'
      ? Math.max(0, turno - 1)
      : obterEstadoHabilidades(carta).ataquesRealizados;
  return Math.min(
    habilidade.escala.limite,
    habilidade.valorBase + habilidade.escala.valor * multiplicador,
  );
}

function calcularValorAplicado(
  valor: number,
  unidade: ConfiguracaoHabilidade['unidade'],
  base: number,
) {
  return Math.max(
    0,
    Math.round(unidade === 'PERCENTUAL' ? (base * valor) / 100 : valor),
  );
}

function obterAlvoHabilidade(
  estado: EstadoBatalha,
  origem: Lado,
  habilidade: ConfiguracaoHabilidade,
) {
  if (habilidade.alvo === 'INIMIGO_ATIVO') {
    return cartaAtiva(estado, origem === 'JOGADOR' ? 'BOT' : 'JOGADOR');
  }
  return cartaAtiva(estado, origem);
}

function registrarAtivacao(
  estado: EstadoBatalha,
  origem: Lado,
  habilidade: ConfiguracaoHabilidade,
  valor: number,
) {
  estado.eventos.push({
    turno: estado.turno,
    tipo: 'HABILIDADE',
    origem,
    valor,
    texto: `${cartaAtiva(estado, origem).nome} ativou ${habilidade.nome}.`,
  });
}

function obterLadoCarta(estado: EstadoBatalha, carta: CartaBatalha) {
  if (estado.jogador.cartas.includes(carta)) return 'JOGADOR' as const;
  if (estado.bot.cartas.includes(carta)) return 'BOT' as const;
  return null;
}

function cartaAtiva(estado: EstadoBatalha, lado: Lado) {
  const equipe = lado === 'JOGADOR' ? estado.jogador : estado.bot;
  return equipe.cartas[equipe.ativa];
}
import type {
  ConfiguracaoHabilidade,
  GatilhoHabilidade,
} from './habilidades/habilidade.types';
