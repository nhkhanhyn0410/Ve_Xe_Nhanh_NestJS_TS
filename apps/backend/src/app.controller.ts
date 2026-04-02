import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get('health')
  healthCheck() {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb:
          this.connection.readyState === mongoose.ConnectionStates.connected
            ? 'connected'
            : 'disconnected',
        uptime: process.uptime(),
      },
    };
  }
}
