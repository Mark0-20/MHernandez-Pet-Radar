export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const PET_CACHE_KEYS = {
  lostPetsActive: 'pet-radar:get:lost-pets:active',
  foundPetsList: 'pet-radar:get:found-pets:list',
} as const;
