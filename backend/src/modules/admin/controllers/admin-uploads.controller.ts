import {
  BadRequestException,
  Controller,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminCloudinaryService } from '../services/admin-cloudinary.service';

type CartaAssetFiles = {
  foto?: Express.Multer.File[];
  moldura?: Express.Multer.File[];
};

const maxAssetSizeBytes = 5 * 1024 * 1024;

function imageFileFilter(
  _request: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
    return;
  }

  callback(new BadRequestException('Envie apenas arquivos de imagem.'), false);
}

const cartaAssetInterceptor = FileFieldsInterceptor(
  [
    { name: 'foto', maxCount: 1 },
    { name: 'moldura', maxCount: 1 },
  ],
  {
    storage: memoryStorage(),
    limits: {
      fileSize: maxAssetSizeBytes,
      files: 2,
    },
    fileFilter: imageFileFilter,
  },
);

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUploadsController {
  constructor(private readonly cloudinaryService: AdminCloudinaryService) {}

  @Post('uploads/cartas')
  @UseInterceptors(cartaAssetInterceptor)
  uploadCartaAssets(@UploadedFiles() files: CartaAssetFiles) {
    return this.cloudinaryService.uploadCartaAssets(files);
  }

  @Patch('cartas/:id/assets')
  @UseInterceptors(cartaAssetInterceptor)
  updateCartaAssets(
    @Param('id') id: string,
    @UploadedFiles() files: CartaAssetFiles,
  ) {
    return this.cloudinaryService.updateCartaAssets(id, files);
  }
}
