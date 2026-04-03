import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { OperatorsModule } from './modules/operators/operators.module';

import { StopPointsModule } from './modules/stop-points/stop-points.module';
// import { RoutesModule } from './modules/routes/routes.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    AdminModule,
    OperatorsModule,
    StopPointsModule,
    // RoutesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
