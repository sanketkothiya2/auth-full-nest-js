import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SendMailService {
    constructor(private mailerService: MailerService) { }

    async sendMail(subject, body, email) {

        return await this.mailerService.sendMail({
            to: email,
            from: 'nestJS@auth.com',
            subject: subject,
            html: body,
        });
    }
}
