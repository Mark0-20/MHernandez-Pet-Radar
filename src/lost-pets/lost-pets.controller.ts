import { Controller, Get } from '@nestjs/common';
import { LostPetsService } from './lost-pets.service';

@Controller('lost-pets')
export class LostPetsController {
  constructor(private readonly lostPetsService: LostPetsService) {}

  @Get()
  findAllActive() {
    return this.lostPetsService.findAllActive();
  }
}
