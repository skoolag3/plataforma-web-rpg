import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const tiposEfeito = [
  'BUFF',
  'DEBUFF',
  'DANO',
  'CURA',
  'ESCUDO',
  'ROUBO_VIDA',
  'EVASAO',
] as const;
const gatilhos = [
  'AO_ENTRAR',
  'AO_ATACAR',
  'AO_RECEBER_DANO',
  'INICIO_TURNO',
  'FIM_TURNO',
] as const;
const alvos = ['PROPRIA_CARTA', 'ALIADO_ATIVO', 'INIMIGO_ATIVO'] as const;
const atributos = ['ATAQUE', 'DEFESA', 'VELOCIDADE'] as const;
const unidades = ['FIXO', 'PERCENTUAL'] as const;
const formasAplicacao = [
  'ANTES_ACAO',
  'APOS_ACAO',
  'SUBSTITUI_ATAQUE',
] as const;
const requisitos = [
  'NENHUM',
  'CONTADOR_ATAQUES',
  'HP_ABAIXO',
  'TURNO_MINIMO',
] as const;
const escalas = ['NENHUMA', 'POR_TURNO', 'POR_ATAQUE'] as const;

export class CreateAdminHabilidadeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;

  @IsIn(tiposEfeito)
  tipoEfeito: (typeof tiposEfeito)[number];

  @IsIn(gatilhos)
  gatilho: (typeof gatilhos)[number];

  @IsIn(alvos)
  alvo: (typeof alvos)[number];

  @IsOptional()
  @IsIn(atributos)
  atributo?: (typeof atributos)[number];

  @IsIn(unidades)
  unidade: (typeof unidades)[number];

  @IsInt()
  @Min(1)
  @Max(9999)
  valorBase: number;

  @IsIn(formasAplicacao)
  formaAplicacao: (typeof formasAplicacao)[number];

  @IsIn(requisitos)
  requisitoTipo: (typeof requisitos)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  requisitoValor?: number;

  @IsIn(escalas)
  escalaTipo: (typeof escalas)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  escalaValor?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  escalaLimite?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  duracaoTurnos?: number;
}
