import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApplicationInsights, shutdownApplicationInsights } from './telemetry';

// Must run before any other import so Application Insights can
// instrument Node.js core modules (http, pg, ioredis …) from the start.
setupApplicationInsights();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Graceful shutdown ────────────────────────────────────────────────────
  // Kubernetes / Docker sends SIGTERM before killing the container.
  // Flushing telemetry here prevents losing the last batch of events.
  const shutdown = async (signal: string) => {
    console.log(`[bootstrap] Received ${signal}, shutting down…`);
    await app.close();
    await shutdownApplicationInsights();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`[bootstrap] Listening on port ${process.env.PORT ?? 3000}`);
}

void bootstrap();
