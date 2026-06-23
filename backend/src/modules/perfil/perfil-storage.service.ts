import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

type TipoImagem = 'avatar' | 'banner';

@Injectable()
export class PerfilStorageService {
  async enviar(
    idUsuario: string,
    tipo: TipoImagem,
    arquivo: Express.Multer.File,
  ) {
    const url = process.env.SUPABASE_URL;
    const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !chave) {
      throw new ServiceUnavailableException(
        'Storage indisponivel. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.mimetype)) {
      throw new BadRequestException('Use uma imagem JPG, PNG ou WebP.');
    }

    const limite = tipo === 'avatar' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (arquivo.size > limite) {
      throw new BadRequestException(
        tipo === 'avatar'
          ? 'O avatar deve ter no maximo 2 MB.'
          : 'O banner deve ter no maximo 5 MB.',
      );
    }

    const extensao =
      arquivo.mimetype === 'image/png'
        ? 'png'
        : arquivo.mimetype === 'image/webp'
          ? 'webp'
          : 'jpg';
    const caminho = `${idUsuario}/${tipo}.${extensao}`;
    const resposta = await fetch(`${url}/storage/v1/object/perfis/${caminho}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chave}`,
        apikey: chave,
        'Content-Type': arquivo.mimetype,
        'x-upsert': 'true',
      },
      body: new Uint8Array(arquivo.buffer),
    });

    if (!resposta.ok) {
      throw new ServiceUnavailableException(
        'Nao foi possivel enviar a imagem para o Storage.',
      );
    }

    return `${url}/storage/v1/object/public/perfis/${caminho}?v=${Date.now()}`;
  }
}
