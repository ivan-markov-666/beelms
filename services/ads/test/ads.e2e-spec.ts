import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  clearDatabase,
  getTestServer,
} from './test.setup';

// Mock authentication tokens
const MOCK_ADMIN_TOKEN = 'mock-admin-token';
const MOCK_USER_TOKEN = 'mock-user-token';

// Interfaces for type safety
interface TestAd {
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  displayLocation: string;
  metadata?: Record<string, any>;
}

interface AdResponse {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  displayLocation: string;
  impressions: number;
  clicks: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface UserAdView {
  id: number;
  adId: number;
  userId?: number;
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  referrer?: string;
  clicked: boolean;
  clickedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface StatisticsResponse {
  totalAds: number;
  activeAds: number;
  totalImpressions: number;
  totalClicks: number;
  clickThroughRate: number;
  ads: Array<{
    id: number;
    title: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

describe('AdsController (e2e)', () => {
  let app: INestApplication;
  let server: request.SuperTest<request.Test>;
  let createdAdId: number;

  // Test data
  const testAd: TestAd = {
    title: 'Test Advertisement',
    description: 'This is a test advertisement',
    imageUrl: 'https://example.com/test.jpg',
    targetUrl: 'https://example.com',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    isActive: true,
    displayLocation: 'sidebar',
  };

  // Setup and teardown
  beforeAll(async () => {
    app = await createTestApp();
    server = getTestServer(app);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /ads', () => {
    it('should create a new advertisement (admin only)', async () => {
      const response = await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(testAd)
        .expect(201);

      const responseBody = response.body as AdResponse;
      expect(responseBody).toMatchObject({
        title: testAd.title,
        description: testAd.description,
        imageUrl: testAd.imageUrl,
        targetUrl: testAd.targetUrl,
        isActive: testAd.isActive,
        displayLocation: testAd.displayLocation,
      });
      expect(responseBody.impressions).toBe(0);
      expect(responseBody.clicks).toBe(0);

      // Save the created ad ID for other tests
      createdAdId = responseBody.id;
    });

    it('should return 401 for unauthenticated requests', async () => {
      await server
        .post('/ads')
        .send(testAd)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_USER_TOKEN}`)
        .send(testAd)
        .expect(403);
    });
  });

  describe('GET /ads', () => {
    it('should list advertisements (admin only)', async () => {
      // First create a test ad
      await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(testAd);

      const response = await server
        .get('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .expect(200);

      const responseBody = response.body as AdResponse[];
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
      expect(responseBody[0]).toMatchObject({
        title: testAd.title,
        description: testAd.description,
      });
    });

    it('should filter advertisements by isActive', async () => {
      // Create active ad
      await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send({ ...testAd, isActive: true });

      // Create inactive ad
      await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send({ ...testAd, isActive: false, title: 'Inactive Ad' });

      // Test active filter
      const activeResponse = await server
        .get('/ads?isActive=true')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .expect(200);

      const activeResponseBody = activeResponse.body as AdResponse[];
      expect(activeResponseBody.every(ad => ad.isActive === true)).toBe(true);

      // Test inactive filter
      const inactiveResponse = await server
        .get('/ads?isActive=false')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .expect(200);

      const inactiveResponseBody = inactiveResponse.body as AdResponse[];
      expect(inactiveResponseBody.every(ad => ad.isActive === false)).toBe(true);
    });
  });

  describe('GET /ads/random', () => {
    it('should return a random active advertisement', async () => {
      // Create an active ad
      await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send({ ...testAd, isActive: true });

      const response = await server
        .get('/ads/random')
        .expect(200);

      const responseBody = response.body as AdResponse;
      expect(responseBody).toMatchObject({
        isActive: true,
      });
      expect(responseBody.impressions).toBeDefined();
      expect(responseBody.clicks).toBeDefined();
    });

    it('should filter by displayLocation', async () => {
      // Create ads with different locations
      await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send({ ...testAd, displayLocation: 'header' });

      await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send({ ...testAd, displayLocation: 'sidebar' });

      const response = await server
        .get('/ads/random?location=header')
        .expect(200);

      const responseBody = response.body as AdResponse;
      expect(responseBody.displayLocation).toBe('header');
    });
  });

  describe('GET /ads/:id', () => {
    let testAdId: number;

    beforeEach(async () => {
      // Create a test ad
      const response = await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(testAd);
      
      testAdId = (response.body as AdResponse).id;
    });

    it('should return a specific advertisement (admin only)', async () => {
      const response = await server
        .get(`/ads/${testAdId}`)
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .expect(200);

      const responseBody = response.body as AdResponse;
      expect(responseBody.id).toBe(testAdId);
      expect(responseBody.title).toBe(testAd.title);
    });

    it('should return 404 for non-existent ad', async () => {
      await server
        .get('/ads/999999')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  describe('PATCH /ads/:id', () => {
    let testAdId: number;

    beforeEach(async () => {
      // Create a test ad
      const response = await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(testAd);
      
      testAdId = (response.body as AdResponse).id;
    });

    it('should update an advertisement (admin only)', async () => {
      const updateData = {
        title: 'Updated Ad Title',
        description: 'Updated description',
        isActive: false,
      };

      const response = await server
        .patch(`/ads/${testAdId}`)
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(updateData)
        .expect(200);

      const responseBody = response.body as AdResponse;
      expect(responseBody.title).toBe(updateData.title);
      expect(responseBody.description).toBe(updateData.description);
      expect(responseBody.isActive).toBe(updateData.isActive);
    });

    it('should return 404 for non-existent ad', async () => {
      await server
        .patch('/ads/999999')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send({ title: 'Non-existent' })
        .expect(404);
    });

    it('should return 403 for non-admin users', async () => {
      await server
        .patch(`/ads/${testAdId}`)
        .set('Authorization', `Bearer ${MOCK_USER_TOKEN}`)
        .send({ title: 'Should not update' })
        .expect(403);
    });
  });

  describe('DELETE /ads/:id', () => {
    let testAdId: number;

    beforeEach(async () => {
      // Create a test ad
      const response = await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(testAd);
      
      testAdId = (response.body as AdResponse).id;
    });

    it('should delete an advertisement (admin only)', async () => {
      await server
        .delete(`/ads/${testAdId}`)
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .expect(200);

      // Verify the ad is deleted
      await server
        .get(`/ads/${testAdId}`)
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .expect(404);
    });

    it('should return 403 for non-admin users', async () => {
      await server
        .delete(`/ads/${testAdId}`)
        .set('Authorization', `Bearer ${MOCK_USER_TOKEN}`)
        .expect(403);
    });
  });

  describe('POST /ads/impression', () => {
    let testAdId: number;

    beforeEach(async () => {
      // Create a test ad
      const response = await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(testAd);
      
      testAdId = (response.body as AdResponse).id;
    });

    it('should record an impression for an ad', async () => {
      const impressionData = {
        adId: testAdId,
        sessionId: 'test-session-123',
        userId: 1,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        referrer: 'https://example.com',
        clicked: false,
      };

      const response = await server
        .post('/ads/impression')
        .send(impressionData)
        .expect(201);

      const responseBody = response.body as UserAdView;
      expect(responseBody).toMatchObject({
        adId: impressionData.adId,
        sessionId: impressionData.sessionId,
        clicked: impressionData.clicked,
      });

      // Verify the impression was recorded by checking the ad's impression count
      const adResponse = await server
        .get(`/ads/${testAdId}`)
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`);
      
      const adResponseBody = adResponse.body as AdResponse;
      expect(adResponseBody.impressions).toBe(1);
    });
  });

  describe('POST /ads/click', () => {
    let testAdId: number;
    let testSessionId: string;

    beforeEach(async () => {
      // Create a test ad
      const response = await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(testAd);
      
      testAdId = (response.body as AdResponse).id;
      testSessionId = `test-session-${Date.now()}`;
      
      // Record an impression first
      await server.post('/ads/impression').send({
        adId: testAdId,
        sessionId: testSessionId,
        userId: 1,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        referrer: 'https://example.com',
        clicked: false,
      });
    });

    it('should record a click for an ad', async () => {
      const clickData = {
        adId: testAdId,
        sessionId: testSessionId,
        userId: 1,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        referrer: 'https://example.com',
      };

      const response = await server
        .post('/ads/click')
        .send(clickData)
        .expect(201);

      const responseBody = response.body as UserAdView;
      expect(responseBody).toMatchObject({
        adId: clickData.adId,
        sessionId: clickData.sessionId,
        clicked: true,
      });

      // Verify the click was recorded by checking the ad's click count
      const adResponse = await server
        .get(`/ads/${testAdId}`)
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`);
      
      const adResponseBody = adResponse.body as AdResponse;
      expect(adResponseBody.clicks).toBe(1);
    });
  });

  describe('GET /ads/statistics', () => {
    it('should return ad statistics (admin only)', async () => {
      // First, create a test ad to get statistics for
      const createResponse = await server
        .post('/ads')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .send(testAd);
      
      const adId = (createResponse.body as AdResponse).id;
      
      // Record an impression and click for the ad
      const sessionId = `test-session-${Date.now()}`;
      await server.post('/ads/impression').send({
        adId,
        sessionId,
        userId: 1,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        referrer: 'https://example.com',
        clicked: false,
      });
      
      await server.post('/ads/click').send({
        adId,
        sessionId,
        userId: 1,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        referrer: 'https://example.com',
      });

      // Get statistics
      const response = await server
        .get('/ads/statistics')
        .set('Authorization', `Bearer ${MOCK_ADMIN_TOKEN}`)
        .expect(200);

      const responseBody = response.body as StatisticsResponse;

      // Basic structure and data validation
      expect(responseBody.totalAds).toBeGreaterThanOrEqual(1);
      expect(responseBody.activeAds).toBeGreaterThanOrEqual(1);
      expect(responseBody.totalImpressions).toBeGreaterThanOrEqual(1);
      expect(responseBody.totalClicks).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(responseBody.ads)).toBe(true);
      
      // Verify our test ad is in the statistics
      const testAdStats = responseBody.ads.find(ad => ad.id === adId);
      expect(testAdStats).toBeDefined();
      expect(testAdStats?.title).toBe(testAd.title);
      expect(testAdStats?.impressions).toBeGreaterThanOrEqual(1);
      expect(testAdStats?.clicks).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for non-admin users', async () => {
      await server
        .get('/ads/statistics')
        .set('Authorization', `Bearer ${MOCK_USER_TOKEN}`)
        .expect(403);
    });
  });
});
