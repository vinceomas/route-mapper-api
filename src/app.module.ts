import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      autoLoadEntities: true,
      synchronize: true,
      database: path.resolve(__dirname, '..', 'db.sqlite')
    }),
    RoutesModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
