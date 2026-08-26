const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type NoticiaPublica = {
  id: string;
  titulo: string;
  resumo: string;
  conteudo?: string;
  imagem: string | null;
  categoria: "NOVIDADE" | "BALANCE" | "EVENTO" | "AVISO";
  anexos?: { titulo: string; url: string }[] | null;
  criado_em: string;
};

async function noticiaRequest<T>(path: string) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error("Não foi possível carregar as notícias.");
  return response.json() as Promise<T>;
}

export function listarNoticias() {
  return noticiaRequest<NoticiaPublica[]>("/noticias");
}

export function buscarNoticia(id: string) {
  return noticiaRequest<NoticiaPublica>(`/noticias/${id}`);
}
