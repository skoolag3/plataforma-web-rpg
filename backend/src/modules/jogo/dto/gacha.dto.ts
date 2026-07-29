import { IsIn, IsUUID } from 'class-validator';

export class GirarGachaDto {
  @IsUUID('4')
  idBanner: string;

  @IsIn([1, 10])
  quantidade: 1 | 10;
}

export class BannerGachaDto {
  @IsUUID('4')
  idBanner: string;
}
