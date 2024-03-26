import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../src/client/auth/auth.module';
import * as pactum from 'pactum';
import { UserRegistrationDto } from '../src/client/auth/dto/userRegistration.dto';
import { UserLoginDto } from '../src/client/auth/dto/userLogin.dto';
import { UserEntity } from '../src/client/user/entities/user.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { TokenEntity } from '../src/client/token/entities/token.entity';
import { AuthController } from '../src/client/auth/auth.controller';
import { AuthService } from '../src/client/auth/auth.service';
import { TokenService } from '../src/client/token/token.service';
import { Repository } from 'typeorm';
import { UserVerificationDto } from 'src/client/auth/dto/userVerification.dto';
import { UserService } from '../src/client/user/user.service';
import { UpdateUserDto } from 'src/client/user/dto/userUpdate.dto';

describe('App Module', () => {
  let app;

  let userRepository: Repository<UserEntity>;
  let tokenRepository: Repository<TokenEntity>;

  let userId = '9288e2e1-8523-4c4d-bbb1-8d06fe5ab520';

  pactum.request.setBaseUrl('http://localhost:5005/api/');

  let refreshToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlkOGM1ZTZhLWU5ZTctNDYxYi1hZDQ3LTNlYjY1MmQyODQyOSIsImZpcnN0TmFtZSI6IlVzZXIiLCJsYXN0TmFtZSI6IlVzZXIiLCJkZXBhcnRtZW50IjoiVXNlciIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzA2MjcyNjU1LCJleHAiOjE3MDg4NjQ2NTV9.xOfPaw_jobAQ81xiPJTrcf_9iD2zMwO02y21YKSjSGs';
  let accessToken: string = 'werewrewrew';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: +5432,
          username: 'postgres',
          password: 'Shadowagain6!',
          database: 'excel',
          entities: ['entity/**/.model.ts'],
          migrations: ['src/migrations/*.ts'],
          migrationsTableName: 'custom_migration_table',
          synchronize: true,
        }),
        TypeOrmModule.forFeature([UserEntity, TokenEntity]),
      ],
      controllers: [AuthController],
      providers: [AuthService, TokenService, UserService],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    tokenRepository = moduleFixture.get(getRepositoryToken(TokenEntity));
    await app.init();
  }, 10000);

  afterAll(async () => {
    try {
      await userRepository.delete({});
      await tokenRepository.delete({});
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    } finally {
      await app.close();
    }
    await app.close();
  });

  describe('App', () => {
    describe('Auth', () => {
      describe('registration', () => {
        const dto: UserRegistrationDto = {
          phoneNumber: '+99365656565',
        };
        it('should register successfully', async () => {
          const response = await pactum
            .spec()
            .post('auth/registration')
            .withBody(dto)
            .expectStatus(201);

          userId = response.body.userId;
          expect(response.body).toHaveProperty('userId');
          expect(response.body).toHaveProperty('message');
        });

        it('should fail to register due to existing user (ConflictException)', async () => {
          await pactum
            .spec()
            .post('auth/registration')
            .withBody(dto)
            .expectStatus(409)
            .expectBodyContains(
              `User with phone ${dto.phoneNumber} already exists. Please login`,
            );
        });
      });

      describe('login', () => {
        const dto: UserLoginDto = {
          phoneNumber: '+99365656565',
        };

        it('should login successfully', async () => {
          const response = await pactum
            .spec()
            .post('auth/login')
            .withBody(dto)
            .expectStatus(200);

          expect(response.body).toHaveProperty('userId');
          expect(response.body).toHaveProperty('message');
        });

        it('should fail login user which not exist (NotFoundException)', async () => {
          const userNotFoundDto: UserLoginDto = {
            phoneNumber: '+99365656566',
          };
          await pactum
            .spec()
            .post('auth/login')
            .withBody(userNotFoundDto)
            .expectStatus(404)
            .expectBodyContains('User not found!');
        });
      });

      describe('verifyAccount', () => {
        const userVerificationDto: UserVerificationDto = {
          verificationCode: '123456',
        };
        const userWrongVerificationDto: UserVerificationDto = {
          verificationCode: '123457',
        };
        it('should verify user account', async () => {
          const response = await pactum
            .spec()
            .post(`auth/verify/${userId}`)
            .withPathParams({ userId })
            .withBody(userVerificationDto)
            .expectStatus(200);
          refreshToken = response.body.refreshToken;
          accessToken = response.body.accessToken;
          expect(response.body).toHaveProperty('user');
          expect(response.body).toHaveProperty('message');
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');
        });

        it('should fail verify user account verifyCode is wrong (BadRequestException)', async () => {
          await pactum
            .spec()
            .post(`auth/verify/${userId}`)
            .withPathParams({ userId })
            .withBody(userWrongVerificationDto)
            .expectStatus(400)
            .expectBodyContains('Verification code wrong');
        });

        it('should fail verify user account verifyCode is expired (BadRequestException)', async () => {
          await pactum
            .spec()
            .post(`auth/verify/${userId}`)
            .withPathParams({ userId })
            .withBody(userWrongVerificationDto)
            .expectStatus(400)
            .expectBodyContains('Verification code expired!');
        });
      });

      describe('refresh', () => {
        it('should refresh tokens successfully', async () => {
          const response = await pactum
            .spec()
            .get('auth/refresh')
            .withCookies('refreshToken', refreshToken)
            .expectStatus(200);

          expect(response.body).toHaveProperty('user');
          expect(response.body).toHaveProperty('message');
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');
        });

        it('should throw Unauthorized (Unauthorized)', async () => {
          await pactum
            .spec()
            .get('auth/refresh')
            .expectStatus(401)
            .expectBodyContains('User unauthorized');
        });
      });

      describe('logout', () => {
        it('should throw Unauthorized (Unauthorized)', async () => {
          await pactum
            .spec()
            .get('auth/logout')
            .withCookies('refreshToken', 'wel;rwerjwepjok')
            .expectStatus(401)
            .expectBodyContains('User unauthorized');
        });

        it('should logout successfully', async () => {
          await pactum
            .spec()
            .post('auth/logout')
            .expectStatus(200)
            .withCookies('refreshToken', refreshToken)
            .expectStatus(200)
            .expectBody({
              message: 'Logged out successfully!',
            });
        });
        it('should throw NotFoundException (NotFoundException)', async () => {
          await pactum
            .spec()
            .get('auth/logout')
            .withCookies('refreshToken', refreshToken)
            .expectStatus(404)
            .expectBodyContains('Token not found!');
        });
      });
    });
  });
  describe('User Module', () => {
    describe('getMe', () => {
      it('Should return current user data', async () => {
        const response = await pactum
          .spec()
          .get('/users/get-me')
          .expectStatus(200)
          .withBearerToken(accessToken);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('message');
      });

      it('should throw new NotFoundException (NotFoundException)', async () => {
        await pactum
          .spec()
          .get('/users/get-me')
          .expectStatus(404)
          .expectBodyContains(`User not found!`);
      });
    });

    it('should update current user data', async () => {
      let updateDto: UpdateUserDto = {
        phoneNumber: '+99365656565',
      };
      const response = await pactum
        .spec()
        .patch('/users')
        .withBody(updateDto)
        .withBearerToken(accessToken)
        .expectStatus(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('message');
    });

    it('should throw new NotFoundException', async () => {
      let updateDto: UpdateUserDto = {
        phoneNumber: '+99365656565',
      };
      await pactum
        .spec()
        .patch('/users')
        .withBody(updateDto)
        .withBearerToken('wqlejqwiohjenio')
        .expectStatus(404)
        .expectBodyContains(`User not found!`);
    });
  });

  describe('Delete current user', () => {
    it('should delete current user data', async () => {
      const response = await pactum
        .spec()
        .patch('/users')
        .withBearerToken(accessToken)
        .expectStatus(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should throw new NotFoundException', async () => {
      await pactum
        .spec()
        .patch('/users')
        .withBearerToken('wqlejqwiohjenio')
        .expectStatus(404)
        .expectBodyContains(`User not found!`);
    });
  });
});
