"use client";

import { Pencil, Plus, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  atualizarAdminClasse,
  criarAdminClasse,
  listarAdminClasses,
  type AdminClasse,
  type SalvarAdminClassePayload,
} from "../../lib/admin";
import styles from "../../styles/admin/adminClasseSelect.module.css";
import { SelectPadrao } from "../../components/ui/controlesFormulario";

const classeVazia: SalvarAdminClassePayload = {
  nome: "",
  descricao: "",
  prioridadeAtaque: 3,
  ativo: true,
};

export function AdminClasseSelect({
  idClasse,
  classeLegada,
  aoSelecionar,
}: {
  idClasse: string;
  classeLegada?: string;
  aoSelecionar: (classe: AdminClasse | null) => void;
}) {
  const [classes, setClasses] = useState<AdminClasse[]>([]);
  const [editando, setEditando] = useState<AdminClasse | null | undefined>();
  const [form, setForm] = useState(classeVazia);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarAdminClasses()
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  function abrir(classe?: AdminClasse) {
    setEditando(classe ?? null);
    setForm(
      classe
        ? {
            nome: classe.nome,
            descricao: classe.descricao ?? "",
            prioridadeAtaque: classe.prioridadeAtaque,
            ativo: classe.ativo,
          }
        : classeVazia,
    );
    setErro("");
  }

  async function salvar() {
    if (!form.nome.trim()) {
      setErro("Informe o nome da classe.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const salva = editando
        ? await atualizarAdminClasse(editando.id, form)
        : await criarAdminClasse(form);
      setClasses((atuais) =>
        [...atuais.filter((item) => item.id !== salva.id), salva].sort(
          (a, b) => a.prioridadeAtaque - b.prioridadeAtaque,
        ),
      );
      aoSelecionar(salva);
      window.dispatchEvent(new Event("admin-classes-updated"));
      setEditando(undefined);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Falha ao salvar classe.",
      );
    } finally {
      setSalvando(false);
    }
  }

  const selecionada = classes.find((classe) => classe.id === idClasse);

  return (
    <div className={styles.campoClasse}>
      <label htmlFor="classe-carta">Classe</label>
      <div className={styles.linhaSelect}>
        <div className={styles.selectClasse}>
          <SelectPadrao
            valor={idClasse}
            aoAlterar={(valor) =>
              aoSelecionar(
                classes.find((classe) => classe.id === valor) ?? null,
              )
            }
            placeholder="Classe"
            ariaLabel="Classe da carta"
            opcoes={[
              {
                valor: "",
                label: classeLegada
                  ? `${classeLegada} (legada, sem vínculo)`
                  : "Sem classe",
                labelCurto: classeLegada ?? "Sem classe",
              },
              ...classes
                .filter((classe) => classe.ativo || classe.id === idClasse)
                .map((classe) => ({
                  valor: classe.id,
                  label: classe.nome,
                  descricao: `Prioridade ${classe.prioridadeAtaque}`,
                })),
            ]}
          />
        </div>
        <button type="button" onClick={() => abrir()} title="Criar classe">
          <Plus />
        </button>
        <button
          type="button"
          onClick={() => selecionada && abrir(selecionada)}
          disabled={!selecionada}
          title="Editar classe selecionada"
        >
          <Pencil />
        </button>
      </div>
      {selecionada ? <small>Prioridade {selecionada.prioridadeAtaque}</small> : null}

      {editando !== undefined ? (
        <div className={styles.fundoModal} role="presentation">
          <section className={styles.modalClasse}>
            <header>
              <div>
                <small>Configuração de combate</small>
                <h2>{editando ? "Editar classe" : "Nova classe"}</h2>
              </div>
              <button type="button" onClick={() => setEditando(undefined)}>
                <X />
              </button>
            </header>
            {erro ? <p className={styles.erro}>{erro}</p> : null}
            <label>
              Nome
              <input
                required
                value={form.nome}
                onChange={(event) =>
                  setForm({ ...form, nome: event.target.value })
                }
              />
            </label>
            <label>
              Descrição
              <input
                value={form.descricao}
                onChange={(event) =>
                  setForm({ ...form, descricao: event.target.value })
                }
              />
            </label>
            <div className={styles.gradeNumeros}>
              <CampoNumero
                label="Prioridade"
                value={form.prioridadeAtaque}
                min={1}
                max={99}
                onChange={(valor) =>
                  setForm({ ...form, prioridadeAtaque: valor })
                }
              />
            </div>
            {editando ? (
              <label className={styles.checkAtiva}>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) =>
                    setForm({ ...form, ativo: event.target.checked })
                  }
                />
                Classe ativa
              </label>
            ) : null}
            <footer>
              <button type="button" onClick={() => setEditando(undefined)}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => void salvar()}
              >
                <Save /> {salvando ? "Salvando..." : "Salvar classe"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function CampoNumero({
  label,
  value,
  min = -90,
  max = 300,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (valor: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
