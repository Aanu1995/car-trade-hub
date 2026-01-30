import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(); // Enable CORS for all origins by default

    await app.init();
  });

  it('/auth/signup (POST)', async () => {
    const userEmail = 'aanu@iam.io';
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: userEmail, password: 'mypassword' })
      .expect(HttpStatus.CREATED);

    const { id, email } = res.body;
    expect(id).toBeDefined();
    expect(email).toEqual(userEmail);
  });

  it('/auth/signin (POST)', async () => {
    const userEmail = 'aanu@iam.io';
    const res = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: userEmail, password: 'mypassword' })
      .expect(HttpStatus.CREATED);

    const { id, email } = res.body;
    expect(id).toBeDefined();
    expect(email).toEqual(userEmail);
    expect(res.get('set-cookie')).toBeDefined();
  });
});
