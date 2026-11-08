import { Activity, ArrowDown, ArrowUp, Crosshair, DoorOpen, Heart, HeartPulse, Hourglass, MoonStar, Play, Repeat2, Save, Shield, ShieldAlert, Sparkles, Sunrise, Swords, Target, X, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import type {
  AdminHabilidade,
  SalvarAdminHabilidadePayload,
} from "../../../lib/admin";
import {
  SelectPadrao,
  type OpcaoSelect,
} from "../../../components/ui/controlesFormulario";
import sharedStyles from "../../../styles/admin/adminShared.module.css";
import featureStyles from "../../../styles/admin/adminHabilidades.module.css";
import { combinarEstilos } from "../shared/combinarEstilos";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/tooltip-07-utils/tooltip";
import { AjudaTiposHabilidade, referenciasTipo, TipoHabilidade } from "./adminHabilidadeTipos";
import tipoStyles from "../../../styles/admin/adminHabilidadeTipos.module.css";

const styles = combinarEstilos(sharedStyles, featureStyles);

function CampoDropdown({
  rotulo,
  ajuda,
  valor,
  opcoes,
  aoAlterar,
  className,
}: {
  rotulo: string;
  ajuda?: string;
  valor: string;
  opcoes: OpcaoSelect[];
  aoAlterar: (valor: string) => void;
  className?: string;
}) {
  return (
    <div className={`${styles.campoDropdown} ${className ?? ""}`}>
      <span>{rotulo}</span>
      <SelectPadrao
        valor={valor}
        aoAlterar={aoAlterar}
        placeholder={rotulo}
        opcoes={opcoes}
      />
      {ajuda ? <small>{ajuda}</small> : null}
    </div>
  );
}

export type FormHabilidade = SalvarAdminHabilidadePayload & { id?: string };

export function alvoDoEfeito(tipo: AdminHabilidade["tipoEfeito"]): AdminHabilidade["alvo"] {
  return tipo === "DANO" || tipo === "DEBUFF" || tipo === "CRITICO"
    ? "INIMIGO_ATIVO"
    : "PROPRIA_CARTA";
}

type Props = {
  form: FormHabilidade;
  salvando: boolean;
  aoAtualizar: <K extends keyof FormHabilidade>(
    campo: K,
    valor: FormHabilidade[K],
  ) => void;
  aoSalvar: (event: FormEvent<HTMLFormElement>) => void;
  aoFechar: () => void;
};

const opcoesTipo: { valor: AdminHabilidade["tipoEfeito"]; texto: string; resumo: string; Icone: LucideIcon }[] = [
  { valor: "DANO", texto: "Causar dano", resumo: "Tira vida do inimigo", Icone: Swords },
  { valor: "CURA", texto: "Curar", resumo: "Recupera vida", Icone: HeartPulse },
  { valor: "ESCUDO", texto: "Criar escudo", resumo: "Protege contra dano", Icone: Shield },
  { valor: "CRITICO", texto: "Golpe crítico", resumo: "Chance de bater mais forte", Icone: Crosshair },
  { valor: "BUFF", texto: "Fortalecer", resumo: "Melhora um atributo", Icone: ArrowUp },
  { valor: "DEBUFF", texto: "Enfraquecer", resumo: "Reduz um atributo", Icone: ArrowDown },
  { valor: "ROUBO_VIDA", texto: "Roubar vida", resumo: "Causa dano e se cura", Icone: Heart },
  { valor: "EVASAO", texto: "Evasão", resumo: "Ajuda a desviar", Icone: Zap },
];

const opcoesEvento: { valor: AdminHabilidade["gatilho"] | "A_CADA_X_TURNOS"; texto: string; resumo: string; Icone: LucideIcon }[] = [
  { valor: "AO_ENTRAR", texto: "Ao entrar", resumo: "Na entrada da carta na batalha", Icone: DoorOpen },
  { valor: "AO_ATACAR", texto: "Ao atacar", resumo: "Quando esta carta faz um ataque", Icone: Swords },
  { valor: "AO_RECEBER_DANO", texto: "Ao receber dano", resumo: "Depois que esta carta sofre dano", Icone: ShieldAlert },
  { valor: "INICIO_TURNO", texto: "Início do turno", resumo: "No começo de cada turno", Icone: Sunrise },
  { valor: "A_CADA_X_TURNOS", texto: "A cada X turnos", resumo: "Em intervalos que você definir", Icone: Repeat2 },
  { valor: "FIM_TURNO", texto: "Fim do turno", resumo: "Quando cada turno termina", Icone: MoonStar },
];

const opcoesCondicao: { valor: Exclude<AdminHabilidade["requisitoTipo"], "INTERVALO_TURNOS">; texto: string; resumo: string; Icone: LucideIcon }[] = [
  { valor: "NENHUM", texto: "Desde o começo", resumo: "Sem requisito adicional", Icone: Play },
  { valor: "TURNO_MINIMO", texto: "Após um turno", resumo: "Espere o turno indicado", Icone: Hourglass },
  { valor: "CONTADOR_ATAQUES", texto: "Após ataques", resumo: "Conta os ataques da carta", Icone: Swords },
  { valor: "HP_ABAIXO", texto: "Vida baixa", resumo: "Abaixo do limite de vida", Icone: Heart },
];

const textosGatilho: Record<AdminHabilidade["gatilho"], string> = {
  AO_ENTRAR: "ao entrar na batalha",
  AO_ATACAR: "quando esta carta atacar",
  AO_RECEBER_DANO: "quando esta carta receber dano",
  INICIO_TURNO: "no início de cada turno",
  FIM_TURNO: "no fim de cada turno",
};

function explicarCondicao(form: FormHabilidade) {
  if (form.tipoEfeito === "CRITICO") return `Em cada ataque há ${form.requisitoValor ?? 25}% de chance de ativar.`;
  if (form.requisitoTipo === "TURNO_MINIMO") return `Só pode ativar a partir do turno ${form.requisitoValor ?? 1}.`;
  if (form.requisitoTipo === "INTERVALO_TURNOS") return `Ativa nos turnos múltiplos de ${form.requisitoValor ?? 2}: ${form.requisitoValor ?? 2}, ${(form.requisitoValor ?? 2) * 2}, ${(form.requisitoValor ?? 2) * 3}...`;
  if (form.requisitoTipo === "CONTADOR_ATAQUES") return `Só pode ativar depois de ${form.requisitoValor ?? 1} ataque(s).`;
  if (form.requisitoTipo === "HP_ABAIXO") return `Só pode ativar com menos de ${form.requisitoValor ?? 1}% de vida.`;
  return "Sem condição extra: pode ativar desde o começo.";
}

export function AdminHabilidadeFormulario({
  form,
  salvando,
  aoAtualizar,
  aoSalvar,
  aoFechar,
}: Props) {
  const alteraAtributo =
    form.tipoEfeito === "BUFF" || form.tipoEfeito === "DEBUFF";
  const aceitaDuracao = alteraAtributo || form.tipoEfeito === "ESCUDO";
  const possuiRequisito = form.requisitoTipo !== "NENHUM";
  const possuiEscala = form.escalaTipo !== "NENHUMA";
  const maximoValorBase = form.tipoEfeito === "CRITICO" ? 100
    : form.tipoEfeito === "EVASAO" ? 95
    : form.tipoEfeito === "ROUBO_VIDA" ? 100
    : form.unidade === "FIXO" ? 9999
    : form.tipoEfeito === "DANO" ? (form.formaAplicacao === "SUBSTITUI_ATAQUE" ? 300 : 50)
    : 100;
  const maximoIncrementoEscala = Math.max(1, Math.ceil(form.valorBase / 2));
  const maximoLimiteEscala = Math.min(maximoValorBase, form.valorBase * 3);
  const critico = form.tipoEfeito === "CRITICO";
  const [etapa, setEtapa] = useState(0);
  const [aviso, setAviso] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const etapas = ["O que faz", "Quando ativa", "Resultado"];

  function avancar() {
    if (etapa === 0 && form.nome.trim().length < 3) {
      setAviso("Dê um nome com pelo menos 3 caracteres para continuar.");
      return;
    }
    if (etapa === 1 && form.requisitoTipo !== "NENHUM") {
      const minimo = form.requisitoTipo === "INTERVALO_TURNOS" ? 2 : 1;
      if (!Number.isInteger(form.requisitoValor) || (form.requisitoValor ?? 0) < minimo || (form.requisitoValor ?? 0) > 100) {
        setAviso(`Informe um valor entre ${minimo} e 100 para a condição.`);
        return;
      }
    }
    setAviso("");
    setEtapa((atual) => Math.min(2, atual + 1));
  }

  function enviarSomenteNaUltimaEtapa(event: FormEvent<HTMLFormElement>) {
    if (etapa !== 2) {
      event.preventDefault();
      return;
    }
    aoSalvar(event);
  }

  return (
    <div
      className={styles.modalBackdrop}
      data-modal-overlay
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) aoFechar();
      }}
    >
      <form
        ref={formRef}
        data-modal-panel
        className={`${styles.usuarioEditor} ${styles.habilidadeEditor} ${styles.habilidadeModal} ${featureStyles.habilidadeModalAjustes}`}
        onSubmit={enviarSomenteNaUltimaEtapa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="habilidade-modal-titulo"
      >
        <header>
          <div>
            <h2 id="habilidade-modal-titulo">
              {form.id ? "Editar habilidade" : "Nova habilidade"}
            </h2>
            <p>Monte a regra em três perguntas. Você poderá testar o rascunho depois.</p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar formulário"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <nav className={featureStyles.etapasHabilidade} aria-label="Etapas da habilidade">
          {etapas.map((nome, indice) => <button key={nome} type="button" aria-current={etapa === indice ? "step" : undefined} onClick={() => { if (indice <= etapa) setEtapa(indice); else avancar(); }}><span>{indice + 1}</span>{nome}</button>)}
        </nav>
        {aviso ? <p className={featureStyles.avisoEtapa} role="alert">{aviso}</p> : null}
        {etapa === 0 ? <div className={featureStyles.conteudoEtapa}>
        <div className={featureStyles.introducaoHabilidade}><Sparkles size={19} aria-hidden="true" /><div><strong>1. O que acontece no jogo?</strong><span>Escolha o resultado principal. Os próximos campos vão depender desta escolha.</span></div></div>
        <div className={featureStyles.campoCompleto}>
          <p className={featureStyles.rotuloGrupo}>Escolha um efeito <AjudaTiposHabilidade titulo="Entenda as cores e os tipos de efeito" /></p>
          <div className={featureStyles.gradeEfeitos} role="group" aria-label="Efeito principal">
            {opcoesTipo.map(({ valor, texto, resumo, Icone }) => (
              <Tooltip key={valor}>
                <TooltipTrigger render={
                  <button type="button" data-tipo={valor} aria-pressed={form.tipoEfeito === valor} className={`${featureStyles.opcaoEfeito} ${tipoStyles.tipoCor} ${form.tipoEfeito === valor ? featureStyles.opcaoEfeitoAtiva : ""}`} onClick={() => aoAtualizar("tipoEfeito", valor)}>
                    <Icone size={19} aria-hidden="true" /><span><strong>{texto}</strong><small>{resumo}</small></span>
                  </button>
                } />
                <TooltipContent><strong>{referenciasTipo[valor].nome}</strong> — {referenciasTipo[valor].explicacao}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        <label className={featureStyles.campoCompleto}>
          Como você vai chamar essa habilidade?
          <input
            value={form.nome}
            onChange={(event) => aoAtualizar("nome", event.target.value)}
            minLength={3}
            maxLength={100}
            required
            placeholder="Ex.: Golpe certeiro"
          />
        </label>
        {critico ? (
          <p className={styles.dicaCritico}>
            Golpe crítico não é um dano separado: ele aumenta o dano de um ataque quando o sorteio dá certo. Na regra atual, só pode acontecer ao atacar.
          </p>
        ) : null}
        </div> : null}
        {etapa === 1 ? <div className={`${featureStyles.conteudoEtapa} ${featureStyles.conteudoEtapaQuando}`}>
        <div className={featureStyles.introducaoHabilidade}><Target size={19} aria-hidden="true" /><div><strong>2. Quando a habilidade pode ativar?</strong><span>Primeiro escolha o evento. Depois, se precisar, adicione uma condição.</span></div></div>
        {critico ? <p className={featureStyles.notaRegra}><strong>Evento: quando esta carta atacar.</strong> O jogo verifica a chance em cada ataque. Receber dano ou chegar a certo turno ainda não podem disparar um crítico nesta versão.</p> : null}
        {!critico && <div className={featureStyles.campoEventos}>
          <p className={featureStyles.rotuloGrupo}>Qual evento dispara a habilidade?</p>
          <div className={featureStyles.gradeEventos} role="group" aria-label="Momento em que a habilidade pode ativar">
            {opcoesEvento.map(({ valor, texto, resumo, Icone }) => <button
              key={valor}
              type="button"
              className={featureStyles.opcaoEvento}
              data-evento={valor}
              aria-pressed={(form.requisitoTipo === "INTERVALO_TURNOS" ? "A_CADA_X_TURNOS" : form.gatilho) === valor}
              onClick={() => {
            if (valor === "A_CADA_X_TURNOS") {
              aoAtualizar("gatilho", "INICIO_TURNO");
              aoAtualizar("requisitoTipo", "INTERVALO_TURNOS");
              aoAtualizar("requisitoValor", 2);
              return;
            }
            aoAtualizar("gatilho", valor as AdminHabilidade["gatilho"]);
            if (form.requisitoTipo === "INTERVALO_TURNOS") aoAtualizar("requisitoTipo", "NENHUM");
            if (valor !== "AO_ATACAR" && form.requisitoTipo === "CONTADOR_ATAQUES") aoAtualizar("requisitoTipo", "NENHUM");
              }}
            ><Icone size={18} aria-hidden="true" /><span><strong>{texto}</strong><small>{resumo}</small></span></button>)}
          </div>
        </div>}
        {form.requisitoTipo === "INTERVALO_TURNOS" ? <label>
          A cada quantos turnos a habilidade ativa?
          <input type="number" min={2} max={100} value={form.requisitoValor ?? 2} onChange={(event) => aoAtualizar("requisitoValor", Number(event.target.value))} required />
          <small>Ex.: 2 ativa no início dos turnos 2, 4, 6... Não ativa no turno 1.</small>
        </label> : null}
        {!critico ? <p className={featureStyles.notaAlvo}>Quem recebe o efeito? <strong>{alvoDoEfeito(form.tipoEfeito) === "INIMIGO_ATIVO" ? "O inimigo ativo" : "A própria carta"}.</strong> O alvo acompanha o efeito escolhido; não é preciso configurar isso separadamente.</p> : null}
        {alteraAtributo ? (
          <CampoDropdown
            rotulo="Qual atributo muda?"
            valor={form.atributo ?? "ATAQUE"}
            aoAlterar={(valor) =>
              aoAtualizar(
                "atributo",
                valor as NonNullable<AdminHabilidade["atributo"]>,
              )
            }
            opcoes={[
              { valor: "ATAQUE", label: "Ataque" },
              { valor: "DEFESA", label: "Defesa" },
              { valor: "VELOCIDADE", label: "Velocidade" },
            ]}
          />
        ) : null}
        {!critico && form.requisitoTipo !== "INTERVALO_TURNOS" ? <div className={featureStyles.campoEventos}>
          <p className={featureStyles.rotuloGrupo}>Precisa cumprir alguma condição além do evento?</p>
          <div className={featureStyles.gradeCondicoes} role="group" aria-label="Condição para ativar a habilidade">
            {opcoesCondicao.map(({ valor, texto, resumo, Icone }) => <button
              key={valor}
              type="button"
              className={`${featureStyles.opcaoEvento} ${featureStyles.opcaoCondicao}`}
              data-evento={valor}
              aria-pressed={form.requisitoTipo === valor}
              onClick={() => {
                aoAtualizar("requisitoTipo", valor);
                if (valor === "CONTADOR_ATAQUES") aoAtualizar("gatilho", "AO_ATACAR");
              }}
            ><Icone size={18} aria-hidden="true" /><span><strong>{texto}</strong><small>{resumo}</small></span></button>)}
          </div>
          {form.requisitoTipo === "CONTADOR_ATAQUES" ? <small className={featureStyles.avisoCondicao}>Esta condição usa o evento “Ao atacar”.</small> : null}
        </div> : null}
        {!critico && possuiRequisito && form.requisitoTipo !== "INTERVALO_TURNOS" ? <label>
          {form.requisitoTipo === "TURNO_MINIMO" ? "A partir de qual turno?" : form.requisitoTipo === "HP_ABAIXO" ? "Abaixo de quantos % de vida?" : "Depois de quantos ataques?"}
          <input type="number" min={1} max={100} value={form.requisitoValor ?? 1} onChange={(event) => aoAtualizar("requisitoValor", Number(event.target.value))} required />
        </label> : null}
        {critico ? <label className={featureStyles.campoCompleto}>
          Em quantos de cada 100 ataques o crítico pode acontecer?
          <input type="number" min={1} max={100} value={form.requisitoValor ?? 25} onChange={(event) => aoAtualizar("requisitoValor", Number(event.target.value))} required />
          <small>Ex.: 25% significa chance de 25 em 100 em cada ataque. Não garante um crítico a cada quatro ataques.</small>
        </label> : null}
        <p className={featureStyles.notaRegra}><strong>Regra até aqui:</strong> {textosGatilho[form.gatilho]}, {explicarCondicao(form)}{!critico ? " Para dano comum, uma chance aleatória ainda não existe na regra atual." : ""}</p>
        </div> : null}
        {etapa === 2 ? <div className={`${featureStyles.conteudoEtapa} ${featureStyles.conteudoEtapaResultado}`}>
        <div className={featureStyles.introducaoHabilidade}><Activity size={19} aria-hidden="true" /><div><strong>3. Qual é o resultado quando ela ativa?</strong><span>Escolha o valor e confira a frase completa antes de salvar.</span></div></div>
        {!critico && <CampoDropdown
          rotulo="O valor será em pontos ou porcentagem?"
          ajuda="Pontos fixos são mais fáceis de prever. Porcentagem depende do valor usado pelo combate."
          className={featureStyles.campoValorEfeito}
          valor={form.unidade}
          aoAlterar={(valor) =>
            aoAtualizar("unidade", valor as AdminHabilidade["unidade"])
          }
          opcoes={[
            { valor: "FIXO", label: "Pontos fixos" },
            { valor: "PERCENTUAL", label: "Porcentagem (%)" },
          ]}
        />}
        <label className={featureStyles.campoValorEfeito}>
          {critico ? "Quanto dano extra no golpe crítico (%)?" : `Qual é o valor do efeito (${form.unidade === "PERCENTUAL" ? "%" : "pontos"})?`}
          <input
            type="number"
            min={1}
            max={maximoValorBase}
            value={form.valorBase}
            onChange={(event) =>
              aoAtualizar("valorBase", Number(event.target.value))
            }
            required
          />
          <small>{critico ? "Ex.: 50 = mais metade do dano do golpe." : "Quanto a habilidade adiciona, remove ou recupera."} Máximo nesta configuração: {maximoValorBase}.</small>
        </label>
        {!critico ? <details className={featureStyles.regrasExtras}>
          <summary><Activity size={18} aria-hidden="true" /><span><strong>Ajustes avançados</strong><small>Opcional: ordem da ação e crescimento do valor</small></span></summary>
          <div className={featureStyles.gradeRegras}>
        {!critico && <CampoDropdown
          rotulo="Em que momento do ataque?"
          ajuda="Use 'após a ação' se não souber qual escolher."
          valor={form.formaAplicacao}
          aoAlterar={(valor) =>
            aoAtualizar(
              "formaAplicacao",
              valor as AdminHabilidade["formaAplicacao"],
            )
          }
          opcoes={[
            { valor: "ANTES_ACAO", label: "Antes da ação" },
            { valor: "APOS_ACAO", label: "Após a ação" },
            { valor: "SUBSTITUI_ATAQUE", label: "No lugar do ataque" },
          ]}
        />}
        {!critico && <CampoDropdown
          rotulo="A força aumenta com o tempo?"
          valor={form.escalaTipo}
          aoAlterar={(valor) =>
            aoAtualizar("escalaTipo", valor as AdminHabilidade["escalaTipo"])
          }
          opcoes={[
            { valor: "NENHUMA", label: "Não" },
            { valor: "POR_TURNO", label: "A cada turno" },
            { valor: "POR_ATAQUE", label: "A cada ataque" },
          ]}
        />}
        {possuiEscala ? (
          <>
            <label>
              Quanto aumenta a cada vez?
              <input
                type="number"
                min={1}
                max={maximoIncrementoEscala}
                value={form.escalaValor ?? 1}
                onChange={(event) =>
                  aoAtualizar("escalaValor", Number(event.target.value))
                }
                required
              />
              <small>Máximo por vez: {maximoIncrementoEscala} (aproximadamente metade do valor base).</small>
            </label>
            <label>
              Até qual valor pode chegar?
              <input
                type="number"
                min={form.valorBase}
                max={maximoLimiteEscala}
                value={form.escalaLimite ?? form.valorBase}
                onChange={(event) =>
                  aoAtualizar("escalaLimite", Number(event.target.value))
                }
                required
              />
              <small>Teto: {maximoLimiteEscala} (até 3 vezes o valor base).</small>
            </label>
          </>
        ) : null}
          </div>
        </details> : null}
        {aceitaDuracao ? (
          <label>
            Por quantos turnos? (opcional)
            <input
              type="number"
              min={1}
              max={20}
              value={form.duracaoTurnos ?? ""}
              onChange={(event) =>
                aoAtualizar(
                  "duracaoTurnos",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              placeholder="Sem duração"
            />
          </label>
        ) : null}
        <section className={featureStyles.resumoHabilidade} aria-label="Resumo da habilidade">
          <strong>É isto que você está criando</strong>
          <p><b>{form.nome || "Esta habilidade"}</b> será verificada {textosGatilho[form.gatilho]}. {explicarCondicao(form)} {critico ? <>Quando ativar, o ataque ganha +{form.valorBase}% de <TipoHabilidade tipo="DANO" texto="dano" />.</> : <>Quando ativar, aplica {form.valorBase}{form.unidade === "PERCENTUAL" ? "%" : " pontos"} de <TipoHabilidade tipo={form.tipoEfeito} texto={referenciasTipo[form.tipoEfeito].nome.toLowerCase()} /> em {form.alvo === "INIMIGO_ATIVO" ? "um inimigo ativo" : form.alvo === "ALIADO_ATIVO" ? "um aliado ativo" : "sua própria carta"}.</>}</p>
          <small>{form.tipoEfeito === "DANO" ? "Dano é aplicado naquele evento; não permanece por vários turnos." : "Depois de salvar, use Testar para conferir um cenário. O teste não executa combate real."}</small>
        </section>
        <details className={featureStyles.regrasExtras}>
          <summary><Sparkles size={18} aria-hidden="true" /><span><strong>Texto para o jogador (opcional)</strong><small>{form.descricao?.trim() ? "Descrição preenchida" : "Adicione uma descrição curta para a carta"}</small></span></summary>
          <label className={featureStyles.campoDescricaoDetalhe}>
            Como você explicaria isso para o jogador?
            <textarea
              value={form.descricao ?? ""}
              onChange={(event) => aoAtualizar("descricao", event.target.value)}
              maxLength={500}
              rows={2}
              placeholder={critico ? "Ex.: Cada ataque tem chance de causar dano extra." : "Ex.: Ao atacar, causa dano extra ao inimigo."}
            />
          </label>
        </details>
        </div> : null}

        <div className={`${styles.editorActions} ${featureStyles.acoesHabilidade}`}>
          <button type="button" onClick={etapa === 0 ? aoFechar : () => setEtapa((atual) => atual - 1)} disabled={salvando}>
            {etapa === 0 ? "Cancelar" : "Voltar"}
          </button>
          <button
            type="button"
            onClick={() => etapa === 2 ? formRef.current?.requestSubmit() : avancar()}
            className={styles.primaryBtn}
            disabled={salvando}
          >
            {etapa === 2 ? <Save aria-hidden="true" /> : null}{" "}
            {etapa === 2 ? salvando ? "Salvando..." : "Salvar rascunho" : "Continuar"}
          </button>
        </div>
      </form>
    </div>
  );
}
