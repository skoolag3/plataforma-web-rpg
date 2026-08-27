import { IsUUID } from 'class-validator';

export class ForcarAdminBannerDto {
  @IsUUID('4')
  idBanner: string;
}
