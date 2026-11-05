const fs = require('fs');
const path = require('path');
const sharp = require('../frontend/node_modules/sharp');

const pastaSaida = path.resolve(__dirname, '../../plataforma-web-rpg-arquivos/documentacao/diagramas/casos-de-uso-separados');
fs.mkdirSync(pastaSaida, { recursive: true });

const escapeXml = (texto) => String(texto)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const ator = (nome, x, y) => `
  <g class="ator">
    <circle cx="${x}" cy="${y}" r="18" />
    <line x1="${x}" y1="${y + 18}" x2="${x}" y2="${y + 74}" />
    <line x1="${x - 30}" y1="${y + 40}" x2="${x + 30}" y2="${y + 40}" />
    <line x1="${x}" y1="${y + 74}" x2="${x - 28}" y2="${y + 112}" />
    <line x1="${x}" y1="${y + 74}" x2="${x + 28}" y2="${y + 112}" />
    <text x="${x}" y="${y + 142}" text-anchor="middle">${escapeXml(nome)}</text>
  </g>`;

const casoUso = (id, nome, x, y, largura = 260) => {
  const linhas = nome.split('\n');
  const inicioY = y - ((linhas.length - 1) * 12);
  return `
  <g id="${id}" class="caso-uso">
    <ellipse cx="${x}" cy="${y}" rx="${largura / 2}" ry="43" />
    ${linhas.map((linha, indice) => `<text x="${x}" y="${inicioY + (indice * 24)}" text-anchor="middle">${escapeXml(linha)}</text>`).join('\n    ')}
  </g>`;
};

const linha = (x1, y1, x2, y2, classe = 'associacao') =>
  `<line class="${classe}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;

const dependencia = (x1, y1, x2, y2, rotulo) => `
  <line class="dependencia" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#seta)" />
  <text class="rotulo" x="${(x1 + x2) / 2}" y="${((y1 + y2) / 2) - 8}" text-anchor="middle">«${rotulo}»</text>`;

const montarSvg = ({ titulo, atores, casos, linhas, dependencias = [], observacao }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
  <defs>
    <marker id="seta" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#333" />
    </marker>
  </defs>
  <style>
    text { font-family: Arial, Helvetica, sans-serif; fill: #111; font-size: 20px; }
    .titulo { font-size: 28px; font-weight: 700; }
    .sistema { fill: #fff; stroke: #222; stroke-width: 2; }
    .nome-sistema { font-size: 20px; font-weight: 700; }
    .ator circle, .ator line { fill: #fff; stroke: #111; stroke-width: 3; }
    .ator text { font-weight: 600; }
    .caso-uso ellipse { fill: #f5f5f5; stroke: #222; stroke-width: 2; }
    .caso-uso text { font-size: 18px; }
    .associacao { stroke: #333; stroke-width: 2; }
    .dependencia { stroke: #333; stroke-width: 2; stroke-dasharray: 9 7; }
    .rotulo { font-size: 16px; fill: #333; paint-order: stroke; stroke: #fff; stroke-width: 7px; stroke-linejoin: round; }
    .nota { font-size: 16px; fill: #555; font-style: italic; }
  </style>
  <rect width="1400" height="900" fill="#fff" />
  <text class="titulo" x="700" y="52" text-anchor="middle">${escapeXml(titulo)}</text>
  <rect class="sistema" x="300" y="92" width="800" height="735" />
  <text class="nome-sistema" x="320" y="124">AnimeCards</text>
  ${linhas.join('\n  ')}
  ${dependencias.join('\n  ')}
  ${atores.join('\n  ')}
  ${casos.join('\n  ')}
  ${observacao ? `<text class="nota" x="700" y="865" text-anchor="middle">${escapeXml(observacao)}</text>` : ''}
</svg>`;

const diagramas = [
  {
    arquivo: '01-autenticacao-perfil',
    titulo: 'Casos de uso — Autenticação e perfil',
    atores: [ator('Jogador', 150, 375)],
    casos: [
      casoUso('cadastrar', 'Cadastrar-se', 500, 210),
      casoUso('entrar', 'Autenticar-se', 870, 210),
      casoUso('perfil', 'Editar perfil', 500, 390),
      casoUso('caixa', 'Consultar caixa\nde entrada', 870, 390),
      casoUso('recompensa', 'Resgatar recompensa\ndiária ou semanal', 685, 610, 300),
    ],
    linhas: [
      linha(180, 435, 370, 210), linha(180, 435, 740, 210), linha(180, 435, 370, 390),
      linha(180, 435, 740, 390), linha(180, 435, 535, 610),
    ],
    dependencias: [dependencia(870, 433, 760, 585, 'extend')],
  },
  {
    arquivo: '02-colecao-decks',
    titulo: 'Casos de uso — Coleção e decks',
    atores: [ator('Jogador', 150, 375)],
    casos: [
      casoUso('colecao', 'Consultar coleção', 500, 190),
      casoUso('filtro', 'Filtrar e ordenar\ncartas', 870, 190),
      casoUso('favorito', 'Favoritar carta', 500, 360),
      casoUso('vender', 'Vender carta', 870, 360),
      casoUso('deck', 'Criar ou editar deck', 500, 550),
      casoUso('equipar', 'Validar e equipar\ndeck', 870, 550),
    ],
    linhas: [
      linha(180, 435, 370, 190), linha(180, 435, 370, 360), linha(180, 435, 740, 360), linha(180, 435, 370, 550),
    ],
    dependencias: [dependencia(630, 190, 740, 190, 'include'), dependencia(630, 550, 740, 550, 'include')],
  },
  {
    arquivo: '03-gacha-loja',
    titulo: 'Casos de uso — Gacha e loja',
    atores: [ator('Jogador', 150, 375), ator('Stripe', 1240, 375)],
    casos: [
      casoUso('banner', 'Consultar banner', 500, 190),
      casoUso('invocar', 'Realizar invocação', 870, 190),
      casoUso('giro', 'Resgatar giro gratuito', 500, 380),
      casoUso('comprar', 'Comprar Rubys', 870, 380),
      casoUso('pagamento', 'Processar pagamento', 870, 600),
    ],
    linhas: [
      linha(180, 435, 370, 190), linha(180, 435, 740, 190), linha(180, 435, 370, 380), linha(180, 435, 740, 380),
      linha(1210, 435, 1000, 600),
    ],
    dependencias: [dependencia(870, 423, 870, 557, 'include')],
  },
  {
    arquivo: '04-arena-progressao',
    titulo: 'Casos de uso — Arena e progressão',
    atores: [ator('Jogador', 150, 375)],
    casos: [
      casoUso('iniciar', 'Iniciar batalha', 500, 185),
      casoUso('alvo', 'Selecionar alvo', 870, 185),
      casoUso('resultado', 'Consultar resultado', 500, 370),
      casoUso('rubys', 'Receber Rubys', 870, 370),
      casoUso('historico', 'Consultar histórico', 500, 570),
      casoUso('ranking', 'Consultar ranking', 870, 570),
    ],
    linhas: [
      linha(180, 435, 370, 185), linha(180, 435, 370, 370), linha(180, 435, 370, 570), linha(180, 435, 740, 570),
    ],
    dependencias: [dependencia(630, 185, 740, 185, 'include'), dependencia(630, 370, 740, 370, 'extend')],
  },
  {
    arquivo: '05-expedicao',
    titulo: 'Casos de uso — Expedição',
    atores: [ator('Jogador', 150, 375), ator('Serviço de IA', 1240, 375)],
    casos: [
      casoUso('iniciar', 'Iniciar expedição', 500, 175),
      casoUso('caminho', 'Escolher caminho', 870, 175),
      casoUso('batalha', 'Realizar batalha', 500, 340),
      casoUso('checkpoint', 'Resgatar checkpoint', 870, 340),
      casoUso('chefe', 'Enfrentar chefe', 500, 530),
      casoUso('eventoIa', 'Processar evento\nimersivo do chefe', 870, 530, 300),
      casoUso('recompensa', 'Calcular recompensa\nou penalidade', 685, 700, 310),
    ],
    linhas: [
      linha(180, 435, 370, 175), linha(180, 435, 370, 340), linha(180, 435, 740, 340), linha(180, 435, 370, 530),
      linha(1210, 435, 1020, 530),
    ],
    dependencias: [
      dependencia(630, 175, 740, 175, 'include'), dependencia(500, 383, 655, 675, 'include'),
      dependencia(630, 530, 720, 530, 'include'), dependencia(870, 573, 715, 675, 'include'),
    ],
    observacao: 'O evento de IA do chefe permanece em desenvolvimento.',
  },
  {
    arquivo: '06-administracao',
    titulo: 'Casos de uso — Administração',
    atores: [ator('Administrador', 150, 375)],
    casos: [
      casoUso('cartas', 'Gerenciar cartas', 500, 175),
      casoUso('classes', 'Gerenciar classes\ne prioridades', 870, 175),
      casoUso('habilidades', 'Gerenciar habilidades\ne passivas', 500, 350),
      casoUso('banners', 'Gerenciar banners', 870, 350),
      casoUso('campanhas', 'Gerenciar campanhas\ne terrenos', 500, 540),
      casoUso('eventos', 'Gerenciar eventos\ne chefes', 870, 540),
      casoUso('dados', 'Consultar dados\nadministrativos', 685, 710, 300),
    ],
    linhas: [
      linha(180, 435, 370, 175), linha(180, 435, 740, 175), linha(180, 435, 370, 350),
      linha(180, 435, 740, 350), linha(180, 435, 370, 540), linha(180, 435, 740, 540), linha(180, 435, 535, 710),
    ],
  },
];

async function gerar() {
  for (const diagrama of diagramas) {
    const svg = montarSvg(diagrama);
    const caminhoSvg = path.join(pastaSaida, `${diagrama.arquivo}.svg`);
    const caminhoPng = path.join(pastaSaida, `${diagrama.arquivo}.png`);
    fs.writeFileSync(caminhoSvg, svg, 'utf8');
    await sharp(Buffer.from(svg)).png().toFile(caminhoPng);
  }
}

gerar().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
