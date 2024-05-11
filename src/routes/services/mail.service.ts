import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MailService{
    constructor(private readonly mailerService: MailerService, private readonly logger: Logger){}

    sendMail(message: string, subject: string){
        this.mailerService.sendMail({
            from: 'Routes Mapper API',
            to: process.env.LOG_EMAIL_ADDRESS,
            subject,
            text: message
        }).then((res) => {
            this.logger.log('MAIL INVIATA');
            this.logger.log(res)
        })
        .catch(err => {
            this.logger.error('ERRORE INVIO MAIL')
            this.logger.error(err)
        })
    }
}