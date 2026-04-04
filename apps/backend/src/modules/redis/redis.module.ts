import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Token để Inject Redis client ở bất kỳ đâu trong hệ thống */
export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);

        const client = new Redis({
          host,
          port,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number): number | null => {
            if (times > 5) return null; // Ngừng thử sau 5 lần
            return Math.min(times * 200, 2000);
          },
        });

        client.on('connect', () => {
          console.log(`[Redis] Đã kết nối thành công tới ${host}:${port}`);
        });

        client.on('error', (err: Error) => {
          console.error('[Redis] Lỗi kết nối:', err.message);
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  /** Dọn dẹp kết nối Redis khi Module bị huỷ */
  onModuleDestroy(): void {
    // Redis client sẽ tự đóng khi process exit
    console.log('[Redis] Module destroyed - Đã ngắt kết nối.');
  }
}
