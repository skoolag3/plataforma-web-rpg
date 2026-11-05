import { Controller, Get } from '@nestjs/common';
import { VitrineService } from './vitrine.service';

@Controller('vitrine')
export class VitrineController {
  constructor(private readonly vitrineService: VitrineService) {}

  @Get('cartas')
  listarCartas() {
    return this.vitrineService.listarCartas();
  }
}
