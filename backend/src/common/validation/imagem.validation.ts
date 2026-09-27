import { BadRequestException } from '@nestjs/common';

const assinaturasImagem = {
  'image/jpeg': (buffer: Buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  'image/png': (buffer: Buffer) =>
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
  'image/webp': (buffer: Buffer) =>
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  'image/gif': (buffer: Buffer) =>
    buffer.length >= 6 &&
    ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii')),
} satisfies Record<string, (buffer: Buffer) => boolean>;

type TipoImagem = keyof typeof assinaturasImagem;

export function validarConteudoImagem(
  arquivo: Express.Multer.File | undefined,
  tiposPermitidos: TipoImagem[] = Object.keys(assinaturasImagem) as TipoImagem[],
) {
  if (!arquivo?.buffer?.length) {
    throw new BadRequestException('Envie um arquivo de imagem válido.');
  }

  const tipoDetectado = tiposPermitidos.find((tipo) =>
    assinaturasImagem[tipo](arquivo.buffer),
  );

  if (!tipoDetectado || arquivo.mimetype !== tipoDetectado) {
    throw new BadRequestException(
      'O conteúdo do arquivo não corresponde a uma imagem permitida.',
    );
  }
}
