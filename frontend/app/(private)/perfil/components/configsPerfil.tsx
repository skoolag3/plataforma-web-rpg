"use client";

import {
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { PerfilConta } from "../../../lib/perfil";
import styles from "../../../styles/perfil/segurancaPerfil.module.css";
import modalStyles from "../../../styles/perfil/modalPerfil.module.css";
import { ModalEdicao } from "./modalEdicao";

type PropsConfigsPerfil = {
  perfil: PerfilConta;
  aoAtualizarEmail: (email: string, senhaAtual: string) => Promise<string>;
  aoAtualizarSenha: (
    senhaAtual: string,
    novaSenha: string,
    confirmarSenha: string,
  ) => Promise<string>;
  aoVincularGoogle: () => Promise<void>;
};

type ModalAberto = "email" | "senha" | null;

export function ConfigsPerfil({
  perfil,
  aoAtualizarEmail,
  aoAtualizarSenha,
  aoVincularGoogle,
}: PropsConfigsPerfil) {
  const [modalAberto, setModalAberto] = useState<ModalAberto>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  function abrirModal(modal: Exclude<ModalAberto, null>) {
    setErro("");
    setSucesso("");
    setModalAberto(modal);
  }

  return (
    <>
      <section className={styles.cardSeguranca}>
        <header className={styles.cabecalhoSeguranca}>
          <span className={styles.iconeConfig}>
            <ShieldCheck aria-hidden="true" />
          </span>
          <span>
            <h2>Segurança da conta</h2>
            <p>Gerencie suas credenciais e formas de acesso.</p>
          </span>
        </header>

        <div className={styles.listaSeguranca}>
          <div className={styles.itemSeguranca}>
            <span className={styles.iconeItemSeguranca}>
              <Mail aria-hidden="true" />
            </span>
            <span>
              <small>E-mail atual</small>
              <strong>{perfil.email}</strong>
            </span>
            <button
              type="button"
              onClick={() => abrirModal("email")}
              aria-label="Editar e-mail"
            >
              <Pencil aria-hidden="true" />
            </button>
          </div>

          <div className={styles.itemSeguranca}>
            <span className={styles.iconeItemSeguranca}>
              <KeyRound aria-hidden="true" />
            </span>
            <span>
              <small>Senha</small>
              <strong className={styles.senhaMascarada}>••••••••••••</strong>
            </span>
            <button
              type="button"
              onClick={() => abrirModal("senha")}
              aria-label="Alterar senha"
            >
              <Pencil aria-hidden="true" />
            </button>
          </div>

          <div className={styles.itemGoogle}>
            <span className={styles.iconeGoogle}>G</span>
            <span>
              <small>Login com Google</small>
              <strong>
                {perfil.googleVinculado
                  ? "Conta Google vinculada"
                  : "Vincule outra forma de acesso"}
              </strong>
            </span>
            <button
              type="button"
              className={styles.btnGoogle}
              title={
                perfil.googleConfigurado
                  ? "Vincular conta Google"
                  : "Requer configuração OAuth do Google"
              }
              disabled={!perfil.googleConfigurado || perfil.googleVinculado}
              onClick={() => void aoVincularGoogle()}
            >
              {perfil.googleVinculado ? "Desvincular" : "Vincular Google"}
            </button>
          </div>
        </div>
      </section>

      {modalAberto === "email" ? (
        <ModalEdicao
          titulo="Alterar e-mail"
          descricao="Enviaremos uma confirmação para o seu e-mail atual."
          aoFechar={() => setModalAberto(null)}
        >
          <form
            className={modalStyles.formModal}
            onSubmit={(evento) => {
              evento.preventDefault();
              const formulario = new FormData(evento.currentTarget);
              const email = String(formulario.get("email") ?? "");
              const senhaAtual = String(formulario.get("senhaAtual") ?? "");

              setErro("");
              setSucesso("");
              setSalvando(true);
              aoAtualizarEmail(email, senhaAtual)
                .then((mensagem) => {
                  setSucesso(mensagem);
                  window.setTimeout(() => setModalAberto(null), 1400);
                })
                .catch((erroCapturado) =>
                  setErro(
                    erroCapturado instanceof Error
                      ? erroCapturado.message
                      : "Não foi possível atualizar o e-mail.",
                  ),
                )
                .finally(() => setSalvando(false));
            }}
          >
            <label>
              E-mail atual
              <input type="email" value={perfil.email} disabled readOnly />
            </label>
            <label>
              Novo e-mail
              <input
                type="email"
                name="email"
                placeholder="novo@email.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Confirme sua senha
              <input
                type="password"
                name="senhaAtual"
                autoComplete="current-password"
                required
              />
            </label>
            {erro ? <p className={modalStyles.erroForm}>{erro}</p> : null}
            {sucesso ? <p className={modalStyles.sucessoForm}>{sucesso}</p> : null}
            <div className={modalStyles.acoesModal}>
              <button
                type="button"
                onClick={() => setModalAberto(null)}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button type="submit" disabled={salvando}>
                {salvando ? "Atualizando..." : "Atualizar e-mail"}
              </button>
            </div>
          </form>
        </ModalEdicao>
      ) : null}

      {modalAberto === "senha" ? (
        <ModalEdicao
          titulo="Alterar senha"
          descricao="Sua senha atual nunca será exibida."
          aoFechar={() => setModalAberto(null)}
        >
          <form
            className={modalStyles.formModal}
            onSubmit={(evento) => {
              evento.preventDefault();
              const formularioElemento = evento.currentTarget;
              const formulario = new FormData(evento.currentTarget);
              const senhaAtual = String(formulario.get("senhaAtual") ?? "");
              const novaSenha = String(formulario.get("novaSenha") ?? "");
              const confirmarSenha = String(
                formulario.get("confirmarSenha") ?? "",
              );

              setErro("");
              setSucesso("");
              setSalvando(true);
              aoAtualizarSenha(senhaAtual, novaSenha, confirmarSenha)
                .then((mensagem) => {
                  setSucesso(mensagem);
                  formularioElemento.reset();
                  window.setTimeout(() => setModalAberto(null), 1200);
                })
                .catch((erroCapturado) =>
                  setErro(
                    erroCapturado instanceof Error
                      ? erroCapturado.message
                      : "Não foi possível atualizar a senha.",
                  ),
                )
                .finally(() => setSalvando(false));
            }}
          >
            <label>
              Senha atual
              <span className={modalStyles.campoSenhaModal}>
                <input
                  type={mostrarSenhas ? "text" : "password"}
                  name="senhaAtual"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhas((atual) => !atual)}
                  aria-label={mostrarSenhas ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenhas ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            <label>
              Nova senha
              <span className={modalStyles.campoSenhaModal}>
                <input
                  type={mostrarSenhas ? "text" : "password"}
                  name="novaSenha"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhas((atual) => !atual)}
                  aria-label={mostrarSenhas ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenhas ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            <label>
              Confirme a nova senha
              <span className={modalStyles.campoSenhaModal}>
                <input
                  type={mostrarSenhas ? "text" : "password"}
                  name="confirmarSenha"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhas((atual) => !atual)}
                  aria-label={mostrarSenhas ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenhas ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            {erro ? <p className={modalStyles.erroForm}>{erro}</p> : null}
            {sucesso ? <p className={modalStyles.sucessoForm}>{sucesso}</p> : null}
            <div className={modalStyles.acoesModal}>
              <button
                type="button"
                onClick={() => setModalAberto(null)}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button type="submit" disabled={salvando}>
                {salvando ? "Atualizando..." : "Atualizar senha"}
              </button>
            </div>
          </form>
        </ModalEdicao>
      ) : null}
    </>
  );
}
