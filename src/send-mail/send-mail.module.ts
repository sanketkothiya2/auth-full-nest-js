import { Global, Module } from '@nestjs/common';
import { SendMailService } from './send-mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import config from '../config/keys';

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: config.mailerHost,
        secure: false,
        auth: {
          user: config.mailerUID,
          pass: config.mailerPass,
        },
      },
    }),
  ],
  providers: [SendMailService],
  exports: [SendMailService], // 👈 export for DI
})
export class SendMailModule {}

