import { Module } from '@nestjs/common';
import { ItemsModule } from './items/items.module';
import { AuthModule } from './auth/auth.module';
import config from './config/keys';
import { SendMailModule } from './send-mail/send-mail.module';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';


@Module({
  imports: [
    MongooseModule.forRoot(config.mongoURI),
    AuthModule,
    // ItemsModule,
    SendMailModule
  ]
})
export class AppModule { }
