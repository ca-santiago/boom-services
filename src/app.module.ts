import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlujoModule } from './flujo/flujo.module';
require('dotenv').config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL),
    FlujoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
