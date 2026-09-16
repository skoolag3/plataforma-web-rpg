const endpoint = 'http://127.0.0.1:3099/mcp';

let requestId = 1;
let sessionId = '';

function parseSse(text) {
  const messages = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.slice(6)));

  return messages.at(-1);
}

async function request(method, params = {}, withSession = true) {
  const headers = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
  };

  if (withSession && sessionId) headers['mcp-session-id'] = sessionId;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: requestId++, method, params }),
  });

  if (!sessionId) sessionId = response.headers.get('mcp-session-id') ?? '';

  const message = parseSse(await response.text());
  if (message?.error) throw new Error(JSON.stringify(message.error));
  return message?.result;
}

async function notify(method) {
  await fetch(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({ jsonrpc: '2.0', method }),
  });
}

async function callTool(name, args = {}) {
  const result = await request('tools/call', { name, arguments: args });
  if (result?.isError) throw new Error(`${name}: ${result.content?.[0]?.text}`);

  const text = result?.content?.find((item) => item.type === 'text')?.text;
  if (!text) return result;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function iniciarMcp() {
  await request(
    'initialize',
    {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'gerador-uml-animecards', version: '1.0.0' },
    },
    false,
  );
  await notify('notifications/initialized');
}

const diagramas = [
  {
    nome: 'Administração - Cartas',
    descricao: 'Operações administrativas reais sobre cartas e seus recursos visuais.',
    casos: [
      'Consultar cartas',
      'Visualizar detalhes da carta',
      'Cadastrar carta',
      'Editar carta',
      'Avaliar impacto da exclusão',
      'Excluir carta',
      'Enviar imagem e moldura',
    ],
  },
  {
    nome: 'Administração - Classes e habilidades',
    descricao: 'Configuração das classes de combate e do ciclo de vida das habilidades.',
    casos: [
      'Consultar classes',
      'Cadastrar classe',
      'Editar classe e prioridade de ataque',
      'Consultar habilidades',
      'Cadastrar habilidade',
      'Editar habilidade',
      'Simular efeito da habilidade',
      'Publicar habilidade',
      'Inativar habilidade',
    ],
  },
  {
    nome: 'Administração - Usuários',
    descricao: 'Consulta, auditoria e ajustes administrativos sobre contas de jogadores.',
    casos: [
      'Pesquisar e filtrar usuários',
      'Consultar detalhes do usuário',
      'Consultar coleção do usuário',
      'Consultar atividade do usuário',
      'Ajustar coleção do usuário',
      'Ajustar saldo de Rubys',
      'Alterar dados e status do usuário',
    ],
  },
  {
    nome: 'Administração - Painel e comunicação',
    descricao: 'Visão administrativa e manutenção do conteúdo informativo exibido na plataforma.',
    casos: [
      'Consultar painel administrativo',
      'Consultar banners',
      'Forçar banner em destaque',
      'Consultar notícias',
      'Cadastrar notícia',
      'Editar notícia',
      'Excluir notícia',
      'Enviar imagem da notícia',
    ],
  },
];

async function criarDiagrama(configuracao) {
  const diagrama = await callTool('getOrCreateUsecaseDiagram', {
    umlDiagram: {
      qualifiedName: configuracao.nome,
      description: configuracao.descricao,
      type: 'USECASE',
    },
  });

  await callTool('openDiagram', { umlDiagram: { ...diagrama, type: 'USECASE' } });

  const apresentacoesExistentes = await callTool(
    'getPresentationModelsInCurrentDiagram',
  );
  const possuiAssociacoes = apresentacoesExistentes.some(
    (item) => item?.presentation?.type === 'Association',
  );

  const ator = await callTool('getOrCreateActor', {
    umlDiagram: { ...diagrama, type: 'USECASE' },
    umlActor: {
      qualifiedName: `${configuracao.nome}::Administrador`,
      description: 'Usuário autenticado com permissão administrativa.',
    },
  });

  const modelos = [{ modelo: ator, x: 70, y: 300 }];

  for (const [indice, nomeCaso] of configuracao.casos.entries()) {
    const caso = await callTool('getOrCreateUsecase', {
      umlDiagram: { ...diagrama, type: 'USECASE' },
      umlUseCase: {
        qualifiedName: `${configuracao.nome}::${nomeCaso}`,
        summary: nomeCaso,
      },
    });

    if (!possuiAssociacoes) {
      await callTool('getOrCreateUsecaseAssociation', {
        umlDiagram: { ...diagrama, type: 'USECASE' },
        umlAssociation: {
          source: ator,
          target: caso,
          sourceType: 'ASSOCIATION',
          targetType: 'ASSOCIATION',
          sourceEndNavigable: false,
          targetEndNavigable: false,
        },
      });
    }

    const coluna = indice % 2;
    const linha = Math.floor(indice / 2);
    modelos.push({
      modelo: caso,
      x: coluna === 0 ? 330 : 730,
      y: 90 + linha * 155,
    });
  }

  for (const item of modelos) {
    const apresentacoes = await callTool('getPresentationByModelId', {
      modelId: item.modelo.id,
    });
    const apresentacao = Array.isArray(apresentacoes)
      ? apresentacoes.find((valor) => valor?.presentation?.diagram?.id === diagrama.id) ??
        apresentacoes[0]
      : apresentacoes;
    const presentationId = apresentacao?.presentation?.id ?? apresentacao?.id;

    if (presentationId) {
      await callTool('setPresentationLocation', {
        modelId: presentationId,
        x: item.x,
        y: item.y,
      });
    }
  }

  const apresentacoes = await callTool('getPresentationModelsInCurrentDiagram');
  let totalAssociacoes = 0;
  for (const apresentacao of apresentacoes) {
    if (apresentacao?.presentation?.type === 'Association') {
      totalAssociacoes += 1;
      await callTool('setLineShape', {
        modelId: apresentacao.presentation.id,
        shape: 'line',
      });
    }
  }

  return {
    nome: configuracao.nome,
    casosDeUso: configuracao.casos.length,
    associacoes: totalAssociacoes,
  };
}

await iniciarMcp();

if (process.env.RECRIAR_UML === '1') {
  for (const configuracao of diagramas) {
    const existente = await callTool('getModelByIdOrQualifiedName', {
      qualifiedName: configuracao.nome,
    });

    if (existente?.id) {
      await callTool('removeModel', { element: existente });
    }
  }
}

const criados = [];
for (const diagrama of diagramas) criados.push(await criarDiagrama(diagrama));

await callTool('saveProject');

console.log(JSON.stringify({ criados }, null, 2));
