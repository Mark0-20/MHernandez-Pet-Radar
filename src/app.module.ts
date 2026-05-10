import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FoundPetsModule } from './found-pets/found-pets.module';
import { LostPetsModule } from './lost-pets/lost-pets.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is required');
        }
        const sync = config.get<string>('DATABASE_SYNC', 'false') === 'true';
        const sslFlag = config.get<string>('DATABASE_SSL', 'false') === 'true';
        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: sync,
          ssl: sslFlag ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    LostPetsModule,
    FoundPetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
