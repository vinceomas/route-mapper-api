import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    constructor(private readonly configService: ConfigService){
        super();
    }

    private readonly logger = new Logger(JwtAuthGuard.name);

    handleRequest(err, user, info) {
        console.warn('AUTH0_ISSUER_URL', process.env.AUTH0_ISSUER_URL)
        console.warn('AUTH0_AUDIENCE', this.configService.get<string>('AUTH0_AUDIENCE'))
        this.logger.error(err);
        this.logger.error(info)
        
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }

}