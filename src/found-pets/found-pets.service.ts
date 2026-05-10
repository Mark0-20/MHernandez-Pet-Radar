import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetCacheService } from '../cache/pet-cache.service';
import { LostPet } from '../lost-pets/lost-pet.entity';
import { PET_CACHE_KEYS } from '../redis/redis.constants';
import { CreateFoundPetDto } from './dto/create-found-pet.dto';
import { FoundPet } from './found-pet.entity';

export interface CreateFoundPetResult {
  found: FoundPet;
  nearbyLostPets: LostPet[];
}

@Injectable()
export class FoundPetsService {
  constructor(
    @InjectRepository(FoundPet)
    private readonly foundPetRepo: Repository<FoundPet>,
    @InjectRepository(LostPet)
    private readonly lostPetRepo: Repository<LostPet>,
    private readonly cache: PetCacheService,
  ) {}

  async findAll(): Promise<FoundPet[]> {
    const cached = await this.cache.getJson<FoundPet[]>(
      PET_CACHE_KEYS.foundPetsList,
    );
    if (cached !== null) return cached;

    const rows = await this.foundPetRepo.find({
      order: { created_at: 'DESC' },
    });
    await this.cache.setJson(PET_CACHE_KEYS.foundPetsList, rows);
    return rows;
  }

  async create(dto: CreateFoundPetDto): Promise<CreateFoundPetResult> {
    const location: FoundPet['location'] = {
      type: 'Point',
      coordinates: [dto.longitude, dto.latitude],
    };

    const entity = this.foundPetRepo.create({
      description: dto.description ?? null,
      location,
    });
    const saved = await this.foundPetRepo.save(entity);

    const nearbyLostPets = await this.lostPetRepo
      .createQueryBuilder('lost')
      .where('lost.is_active = :active', { active: true })
      .andWhere(
        `ST_DWithin(lost.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lng: dto.longitude, lat: dto.latitude, radius: 500 },
      )
      .orderBy('lost.created_at', 'DESC')
      .getMany();

    await this.cache.del(PET_CACHE_KEYS.foundPetsList);

    return { found: saved, nearbyLostPets };
  }
}
