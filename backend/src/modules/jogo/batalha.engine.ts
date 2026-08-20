export type Dificuldade = 'FACIL' | 'MEDIA' | 'DIFICIL';
export type Lado = 'JOGADOR' | 'BOT';

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

export type CartaBatalha = CartaBatalhaBase & {
  hpAtual: number;
  ataqueAtual: number;
  defesaAtual: number;
  velocidadeAtual: number;
  derrotada: boolean;
};

export type EventoBatalha = {
  turno: number;
  tipo: 'ENTRADA' | 'BUFF' | 'DEBUFF' | 'ATAQUE' | 'DANO' | 'DERROTA' | 'FIM';
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
      velocidade: Math.max(1, Math.round(carta.velocidade * multiplicador)),
      hpAtual: Math.max(1, Math.round(carta.hp * multiplicador)),
      ataqueAtual: Math.max(1, Math.round(carta.ataque * multiplicador)),
      defesaAtual: Math.max(0, Math.round(carta.defesa * multiplicador)),
      velocidadeAtual: Math.max(
        1,
        Math.round(carta.velocidade * multiplicador),
      ),
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

export function executarTurno(estado: EstadoBatalha): EstadoBatalha {
  if (estado.status === 'FINALIZADA') return estado;
  estado.turno += 1;
  const ordem: Lado[] = ['JOGADOR', 'BOT'];
  for (const lado of ordem) {
    if (estado.vencedor) break;
    const alvo: Lado = lado === 'JOGADOR' ? 'BOT' : 'JOGADOR';
    if (!cartaAtiva(estado, lado).derrotada) atacar(estado, lado, alvo);
  }
  return estado;
}

function atacar(estado: EstadoBatalha, origem: Lado, alvo: Lado) {
  const atacante = cartaAtiva(estado, origem);
  const defensor = cartaAtiva(estado, alvo);
  aplicarPassivaAtaque(estado, origem, alvo);
  const dano = Math.max(
    1,
    Math.round(atacante.ataqueAtual - defensor.defesaAtual * 0.45),
  );
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
  if (passiva.gatilho !== 'on_enter') return;
  const alvo =
    passiva.alvo === 'enemy' ? (lado === 'JOGADOR' ? 'BOT' : 'JOGADOR') : lado;
  aplicarModificador(estado, lado, alvo, passiva);
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

function cartaAtiva(estado: EstadoBatalha, lado: Lado) {
  const equipe = lado === 'JOGADOR' ? estado.jogador : estado.bot;
  return equipe.cartas[equipe.ativa];
}
