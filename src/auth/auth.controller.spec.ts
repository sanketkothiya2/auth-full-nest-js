import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { Test, TestingModule } from '@nestjs/testing';
import { SendMailModule } from '../send-mail/send-mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserSchema } from './schemas/user.schema';
import { VerifySchema } from './schemas/verify.schema';
import config from '../config/keys';
import { AuthModule } from './auth.module';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forFeature(
          [
            { name: 'User', schema: UserSchema },
            { name: 'Token', schema: VerifySchema }
          ]
        ),
        MongooseModule.forRoot(config.mongoURI),
        AuthModule,
        SendMailModule
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
