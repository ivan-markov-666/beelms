import { Test, TestingModule } from '@nestjs/testing';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Advertisement } from './entities/advertisement.entity';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { AdImpressionDto } from './dto/ad-impression.dto';
import { AdClickDto } from './dto/ad-click.dto';

describe('AdsController', () => {
  let controller: AdsController;
  let service: AdsService;

  const mockAdvertisement: Advertisement = {
    id: 1,
    title: 'Test Advertisement',
    description: 'Test Description',
    imageUrl: 'https://example.com/image.jpg',
    targetUrl: 'https://example.com',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    isActive: true,
    impressions: 0,
    clicks: 0,
    displayLocation: 'sidebar',
    metadata: { campaign: 'test' },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  const mockRepository = {
    create: jest
      .fn()
      .mockImplementation(
        (dto: Partial<Advertisement>): Partial<Advertisement> => dto,
      ),
    save: jest.fn().mockImplementation(
      (ad: Partial<Advertisement>): Advertisement => ({
        id: 1,
        title: ad.title || '',
        description: ad.description || '',
        imageUrl: ad.imageUrl || '',
        targetUrl: ad.targetUrl || '',
        startDate:
          ad.startDate instanceof Date
            ? ad.startDate
            : new Date(String(ad.startDate || new Date().toISOString())),
        endDate:
          ad.endDate instanceof Date
            ? ad.endDate
            : new Date(String(ad.endDate || new Date().toISOString())),
        isActive: true,
        impressions: 0,
        clicks: 0,
        displayLocation: ad.displayLocation || 'sidebar',
        metadata: ad.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockAdvertisement),
      getMany: jest.fn().mockResolvedValue([mockAdvertisement]),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalAds: 1,
        activeAds: 1,
        totalImpressions: 10,
        totalClicks: 5,
        ctr: 0.5,
      }),
    })),
    findOne: jest.fn().mockResolvedValue(mockAdvertisement),
    find: jest.fn().mockResolvedValue([mockAdvertisement]),
    update: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdsController],
      providers: [
        AdsService,
        {
          provide: getRepositoryToken(Advertisement),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<AdsController>(AdsController);
    service = module.get<AdsService>(AdsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new advertisement', async () => {
      const createDto: CreateAdvertisementDto = {
        title: 'New Advertisement',
        description: 'New Description',
        imageUrl: 'https://example.com/new-image.jpg',
        targetUrl: 'https://example.com/new',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        displayLocation: 'sidebar',
        metadata: { campaign: 'new' },
      };

      const mockResult: Advertisement = {
        id: 1,
        title: createDto.title,
        description: createDto.description,
        imageUrl: createDto.imageUrl,
        targetUrl: createDto.targetUrl,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        displayLocation: createDto.displayLocation || 'sidebar',
        metadata: createDto.metadata || {},
        isActive: true,
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const spy = jest.spyOn(service, 'create').mockResolvedValue(mockResult);

      expect(await controller.create(createDto)).toEqual(mockResult);
      expect(spy).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of advertisements', async () => {
      const spy = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue([mockAdvertisement]);

      expect(await controller.findAll('true', 'sidebar', '10')).toEqual([
        mockAdvertisement,
      ]);
      expect(spy).toHaveBeenCalledWith({
        active: true,
        location: 'sidebar',
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single advertisement', async () => {
      const spy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockAdvertisement);

      expect(await controller.findOne('1')).toEqual(mockAdvertisement);
      expect(spy).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update an advertisement', async () => {
      const updateDto: UpdateAdvertisementDto = {
        title: 'Updated Advertisement',
        description: 'Updated Description',
      };

      const updatedAd: Advertisement = {
        ...mockAdvertisement,
        title: updateDto.title || '',
        description: updateDto.description || '',
        updatedAt: new Date(),
      };

      const spy = jest.spyOn(service, 'update').mockResolvedValue(updatedAd);

      expect(await controller.update('1', updateDto)).toEqual(updatedAd);
      expect(spy).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove an advertisement', async () => {
      const spy = jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove('1');
      expect(spy).toHaveBeenCalledWith(1);
    });
  });

  describe('getRandomAd', () => {
    it('should return a random advertisement', async () => {
      const spy = jest
        .spyOn(service, 'getRandomAd')
        .mockResolvedValue(mockAdvertisement);

      expect(await controller.getRandomAd('sidebar')).toEqual(
        mockAdvertisement,
      );
      expect(spy).toHaveBeenCalledWith('sidebar');
    });
  });

  describe('recordImpression', () => {
    it('should record an impression', async () => {
      const impressionDto: AdImpressionDto = {
        adId: 1,
        userId: '123',
        sessionId: 'abc123',
      };

      const adWithImpression: Advertisement = {
        ...mockAdvertisement,
        impressions: 1,
      };

      const spy = jest
        .spyOn(service, 'recordImpression')
        .mockResolvedValue(adWithImpression);

      expect(await controller.recordImpression(impressionDto)).toEqual(
        adWithImpression,
      );
      expect(spy).toHaveBeenCalledWith(impressionDto);
    });
  });

  describe('recordClick', () => {
    it('should record a click', async () => {
      const clickDto: AdClickDto = {
        adId: 1,
        userId: '123',
        sessionId: 'abc123',
      };

      const adWithClick: Advertisement = {
        ...mockAdvertisement,
        clicks: 1,
      };

      const spy = jest
        .spyOn(service, 'recordClick')
        .mockResolvedValue(adWithClick);

      expect(await controller.recordClick(clickDto)).toEqual(adWithClick);
      expect(spy).toHaveBeenCalledWith(clickDto);
    });
  });

  describe('getStatistics', () => {
    it('should return advertisement statistics', async () => {
      const statistics = {
        totalAds: 1,
        activeAds: 1,
        totalImpressions: 10,
        totalClicks: 5,
        ctr: 0.5,
      };

      const spy = jest
        .spyOn(service, 'getStatistics')
        .mockResolvedValue(statistics);

      expect(await controller.getStatistics()).toEqual(statistics);
      expect(spy).toHaveBeenCalled();
    });
  });
});
