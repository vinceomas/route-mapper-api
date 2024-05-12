import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { RoutesModule } from './routes/routes.module';
import { ConfigModule } from '@nestjs/config';
import { AuthzModule } from './authz/authz.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      autoLoadEntities: true,
      synchronize: true,
      database: path.resolve(__dirname, '..', 'db.sqlite')
    }),
    RoutesModule,
    ScheduleModule.forRoot(),
    AuthzModule,
    MailerModule.forRoot({
      transport: {
        //host: process.env.EMAIL_HOST,
        host: "sandbox.smtp.mailtrap.io",
        auth: {
          // user: process.env.EMAIL_USERNAME,
          // pass: process.env.EMAIL_PASSWORD,
          user: "29ee18d020fc51",
          pass: "d03726e73eb7e4"
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
