import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService{
    constructor(private readonly mailerService: MailerService){}

    sendMail(message: string, subject: string){
        this.mailerService.sendMail({
            from: 'Routes Mapper API',
            to: process.env.LOG_EMAIL_ADDRESS,
            subject,
            text: message
        }).then((res) => {
            console.log('MAIL INVIATA', res);
        })
        .catch(err => {
            console.log('ERRORE INVIO MAIL', err)
        })
    }
}