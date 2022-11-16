import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, VerifiedCallback } from "passport-jwt";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/user.interface';
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { AuthService } from "./auth.service";
import config from '../config/keys';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectModel('User') private readonly usersModel: Model<User>,
        private authService: AuthService
    ) {
        super({
            secretOrKey: config.secretKey,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        });
    }

    async validate(payload: JwtPayload, done: VerifiedCallback) {
        const { email } = payload;
        const user: User = await this.usersModel.findOne({ email });

        if (!user) {
            return done(
                new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED),
                false,
            );
        }
        // return user;
        return done(null, user, payload);
    }
}