import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserSchema } from './schemas/user.schema';
import { VerifySchema } from './schemas/verify.schema';
import config from '../config/keys';
import { SendMailModule } from '../send-mail/send-mail.module';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';

describe('AuthService', () => {
  let service: AuthService;
  let JWTservice: JwtStrategy;

  const userInput = {
    name: "Jigar",
    email: "work.jigardonga@gmail.com",
    password: "123"
  }

  const userProp = ['_id', 'name', 'email', 'password', 'role', 'verifiedd'];

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

    service = module.get<AuthService>(AuthService);
    JWTservice = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  service.createUser(userInput)
    .then(async (createdUser) => {
      if (createdUser) {

        it('Should be return User', () => {
          expect(createdUser).toMatchObject({
            name: userInput.name,
            email: userInput.email
          })
        });

        it('Should delete User', async () => {
          expect(await service.deleteAccount(createdUser._id)).toBe(true);
        });
        

        // userProp.map(prop => {
        //   expect(createdUser).toHaveProperty(prop);
        // })

      }
    })
    .catch(err => console.log(err))

  // it('should be return User', async () => {
  //   const createdUser = await service.createUser(userInput)

  //   if (createdUser) {
  //     expect(createdUser).toMatchObject({
  //       name: userInput.name,
  //       email: userInput.email
  //     })

  //     // userProp.map(prop => {
  //     //   expect(createdUser).toHaveProperty(prop);
  //     // })

  //     expect(await service.deleteAccount(createdUser._id)).toBe(true);
  //   }
  // });

  // it('should be defined', () => {
  //   expect(JWTservice).toBeDefined();
  // });
});
