import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlujoModule } from './flujo/flujo.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL),
    FlujoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
