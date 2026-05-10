import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetCacheService } from '../cache/pet-cache.service';
import { PET_CACHE_KEYS } from '../redis/redis.constants';
import { LostPet } from './lost-pet.entity';

@Injectable()
export class LostPetsService {
  constructor(
    @InjectRepository(LostPet)
    private readonly lostPetRepo: Repository<LostPet>,
    private readonly cache: PetCacheService,
  ) {}

  async findAllActive(): Promise<LostPet[]> {
    const cached = await this.cache.getJson<LostPet[]>(
      PET_CACHE_KEYS.lostPetsActive,
    );
    if (cached !== null) return cached;

    const rows = await this.lostPetRepo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
    await this.cache.setJson(PET_CACHE_KEYS.lostPetsActive, rows);
    return rows;
  }
}
