import { Controller, Get, Param } from '@nestjs/common';
import { NoticiasService } from './noticias.service';

@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @Get()
  listar() {
    return this.noticiasService.listar();
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.noticiasService.buscar(id);
  }
}
