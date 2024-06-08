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
        if (err || !user) {
            this.logger.error(err);
            throw err || new UnauthorizedException();
        }
        return user;
    }

}