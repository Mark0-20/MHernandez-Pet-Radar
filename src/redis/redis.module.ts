import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PetCacheService } from '../cache/pet-cache.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6379)),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        }),
      inject: [ConfigService],
    },
    PetCacheService,
  ],
  exports: [REDIS_CLIENT, PetCacheService],
})
export class RedisModule {}
