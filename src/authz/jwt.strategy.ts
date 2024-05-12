import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        //jwksUri: `${process.env.AUTH0_ISSUER_URL}.well-known/jwks.json`,
        jwksUri: 'https://dev-cjrjffsc4f6jz735.us.auth0.com/.well-known/jwks.json',
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      //audience: process.env.AUTH0_AUDIENCE,
      audience: "https://route-mapper-api",
      //issuer: `${process.env.AUTH0_ISSUER_URL}`,
      issuer: 'https://dev-cjrjffsc4f6jz735.us.auth0.com/',
      algorithms: ['RS256'],
    });
  }

  validate(payload: unknown): unknown {
    return payload;
  }
}