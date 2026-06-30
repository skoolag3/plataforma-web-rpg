import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../../database/prisma.service';

type CartaAssetFiles = {
  foto?: Express.Multer.File[];
  moldura?: Express.Multer.File[];
};

type UploadedAsset = {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
};

@Injectable()
export class AdminCloudinaryService {
  private configured = false;

  constructor(private readonly prisma: PrismaService) {}

  async uploadCartaAssets(files: CartaAssetFiles) {
    const { foto, moldura } = this.extractFiles(files);

    if (!foto && !moldura) {
      throw new BadRequestException('Envie foto, moldura ou ambos.');
    }

    const [fotoUpload, molduraUpload] = await Promise.all([
      foto ? this.uploadImage(foto, 'cartas/fotos') : Promise.resolve(null),
      moldura
        ? this.uploadImage(moldura, 'cartas/molduras')
        : Promise.resolve(null),
    ]);

    return {
      foto: fotoUpload,
      moldura: molduraUpload,
    };
  }

  async updateCartaAssets(id: string, files: CartaAssetFiles) {
    const carta = await this.prisma.carta.findUnique({
      where: { id },
    });

    if (!carta) {
      throw new NotFoundException('Carta nao encontrada.');
    }

    const assets = await this.uploadCartaAssets(files);

    const cartaAtualizada =
      assets.foto || assets.moldura
        ? await this.prisma.carta.update({
            where: { id },
            data: {
              ...(assets.foto ? { foto: assets.foto.url } : {}),
              ...(assets.moldura ? { moldura: assets.moldura.url } : {}),
              atualizado_em: new Date(),
            },
          })
        : carta;

    return {
      carta: cartaAtualizada,
      assets,
    };
  }

  private extractFiles(files: CartaAssetFiles) {
    return {
      foto: files.foto?.[0],
      moldura: files.moldura?.[0],
    };
  }

  private uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedAsset> {
    this.configureCloudinary();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: this.getFolder(folder),
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                'Nao foi possivel enviar imagem ao Cloudinary.',
              ),
            );
            return;
          }

          resolve(this.mapUploadResult(result));
        },
      );

      stream.end(file.buffer);
    });
  }

  private configureCloudinary() {
    if (this.configured) {
      return;
    }

    if (process.env.CLOUDINARY_URL) {
      const cloudinaryUrlConfig = this.parseCloudinaryUrl(
        process.env.CLOUDINARY_URL,
      );
      cloudinary.config({
        cloud_name: cloudinaryUrlConfig.cloudName,
        api_key: cloudinaryUrlConfig.apiKey,
        api_secret: cloudinaryUrlConfig.apiSecret,
        secure: true,
      });
      this.configured = true;
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Configure CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.configured = true;
  }

  private getFolder(folder: string) {
    const root = process.env.CLOUDINARY_ASSET_FOLDER ?? 'anime-cards';

    return `${root}/${folder}`.replace(/\/{2,}/g, '/');
  }

  private parseCloudinaryUrl(value: string) {
    try {
      const url = new URL(value);

      if (url.protocol !== 'cloudinary:' || !url.username || !url.password) {
        throw new Error('Invalid Cloudinary URL.');
      }

      return {
        cloudName: url.hostname,
        apiKey: decodeURIComponent(url.username),
        apiSecret: decodeURIComponent(url.password),
      };
    } catch {
      throw new InternalServerErrorException('CLOUDINARY_URL invalida.');
    }
  }

  private mapUploadResult(result: UploadApiResponse): UploadedAsset {
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    };
  }
}
