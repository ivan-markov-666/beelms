import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Advertisement } from './entities/advertisement.entity';
import { UserAdView } from './entities/user-ad-view.entity';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { AdImpressionDto } from './dto/ad-impression.dto';
import { AdClickDto } from './dto/ad-click.dto';

/**
 * Типизирани интерфейси за статистика на реклами
 */
export interface StatisticsResult {
  totalAds: number;
  activeAds: number;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
}

interface RawViewsQueryResult {
  totalViews: string | number;
  uniqueSessions: string | number;
  uniqueUsers: string | number;
}

interface RawClicksQueryResult {
  totalClicks: string | number;
  uniqueSessionClicks: string | number;
  uniqueUserClicks: string | number;
}

interface RawDailyActivityResult {
  date: string;
  views: string | number;
  clicks: string | number;
}

interface RawCountResult {
  total: string | number;
}

export interface AdStatisticsResult {
  id: number;
  title: string;
  status: string;
  period: string;
  impressions: number;
  clicks: number;
  ctr: number;
  details: {
    views: {
      total: number;
      uniqueSessions: number;
      uniqueUsers: number;
    };
    clicks: {
      total: number;
      uniqueSessions: number;
      uniqueUsers: number;
    };
    recentActivity: Array<{
      timestamp: Date;
      userId: string;
      sessionId: string;
      clicked: boolean;
      referrer?: string;
    }>;
    dailyActivity: Array<{
      date: string;
      views: number;
      clicks: number;
    }>;
  };
}

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Advertisement)
    private advertisementRepository: Repository<Advertisement>,
    @InjectRepository(UserAdView)
    private userAdViewRepository: Repository<UserAdView>,
  ) {}

  /**
   * Create a new advertisement
   */
  async create(
    createAdvertisementDto: CreateAdvertisementDto,
  ): Promise<Advertisement> {
    const advertisement = this.advertisementRepository.create({
      ...createAdvertisementDto,
      startDate: new Date(createAdvertisementDto.startDate),
      endDate: new Date(createAdvertisementDto.endDate),
    });
    return this.advertisementRepository.save(advertisement);
  }

  /**
   * Find all advertisements with optional filtering
   */
  async findAll(options?: {
    active?: boolean;
    location?: string;
    limit?: number;
  }): Promise<Advertisement[]> {
    const { active = true, location, limit = 10 } = options || {};

    const currentDate = new Date();
    const queryBuilder = this.advertisementRepository.createQueryBuilder('ad');

    if (active) {
      queryBuilder
        .where('ad.isActive = :active', { active: true })
        .andWhere('ad.startDate <= :currentDate', { currentDate })
        .andWhere('ad.endDate >= :currentDate', { currentDate });
    }

    if (location) {
      queryBuilder.andWhere('ad.displayLocation = :location', { location });
    }

    return queryBuilder.orderBy('RANDOM()').limit(limit).getMany();
  }

  /**
   * Find a single advertisement by id
   */
  async findOne(id: number): Promise<Advertisement> {
    const advertisement = await this.advertisementRepository.findOne({
      where: { id },
    });
    if (!advertisement) {
      throw new NotFoundException(`Advertisement with ID ${id} not found`);
    }
    return advertisement;
  }

  /**
   * Update an advertisement
   */
  async update(
    id: number,
    updateAdvertisementDto: UpdateAdvertisementDto,
  ): Promise<Advertisement> {
    const advertisement = await this.findOne(id);

    // Convert date strings to Date objects if provided
    const updates = { ...updateAdvertisementDto } as Partial<Advertisement>;
    if (updates.startDate && typeof updates.startDate === 'string') {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate && typeof updates.endDate === 'string') {
      updates.endDate = new Date(updates.endDate);
    }

    const updatedAd = this.advertisementRepository.merge(
      advertisement,
      updates,
    );
    return this.advertisementRepository.save(updatedAd);
  }

  /**
   * Remove an advertisement
   */
  async remove(id: number): Promise<void> {
    const advertisement = await this.findOne(id);
    await this.advertisementRepository.remove(advertisement);
  }

  /**
   * Get a random active advertisement for display
   */
  async getRandomAd(location: string = 'sidebar'): Promise<Advertisement> {
    const currentDate = new Date();

    const ads = await this.advertisementRepository.find({
      where: {
        isActive: true,
        displayLocation: location,
        startDate: LessThanOrEqual(currentDate),
        endDate: MoreThanOrEqual(currentDate),
      },
      order: {
        impressions: 'ASC', // Prioritize ads with fewer impressions
      },
      take: 5, // Get top 5 with fewer impressions
    });

    if (!ads.length) {
      throw new NotFoundException('No active advertisements found');
    }

    // Select a random ad from the top 5
    const randomIndex = Math.floor(Math.random() * ads.length);
    return ads[randomIndex];
  }

  /**
   * Record an ad impression
   */
  async recordImpression(
    impressionDto: AdImpressionDto,
  ): Promise<Advertisement> {
    const ad = await this.findOne(impressionDto.adId);
    ad.impressions += 1;

    // Store detailed impression data for analysis
    const userAdView = this.userAdViewRepository.create({
      adId: impressionDto.adId,
      userId: impressionDto.userId,
      sessionId: impressionDto.sessionId,
      ipAddress: impressionDto.ipAddress,
      userAgent: impressionDto.userAgent,
      referrer: impressionDto.referrer,
      clicked: false,
    });
    await this.userAdViewRepository.save(userAdView);

    return this.advertisementRepository.save(ad);
  }

  /**
   * Record an ad click
   * @param clickDto - Data for the ad click
   * @returns Statistics data after recording the click
   */
  async recordClick(clickDto: AdClickDto): Promise<StatisticsResult> {
    const ad = await this.findOne(clickDto.adId);
    ad.clicks += 1;

    // First try to find if there is an existing impression record
    let userAdView = await this.userAdViewRepository.findOne({
      where: {
        adId: clickDto.adId,
        sessionId: clickDto.sessionId,
        userId: clickDto.userId,
        clicked: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (userAdView) {
      // Update the existing record to mark it as clicked
      userAdView.clicked = true;
      await this.userAdViewRepository.save(userAdView);
    } else {
      // Create a new record if none exists
      userAdView = this.userAdViewRepository.create({
        adId: clickDto.adId,
        userId: clickDto.userId,
        sessionId: clickDto.sessionId,
        ipAddress: clickDto.ipAddress,
        userAgent: clickDto.userAgent,
        referrer: clickDto.referrer,
        clicked: true,
      });
      await this.userAdViewRepository.save(userAdView);
    }

    // Save the updated advertisement with increased click count
    await this.advertisementRepository.save(ad);

    // Return statistics after recording the click
    return this.getStatistics();
  }

  /**
   * Get statistics for all ads
   * @returns Object with aggregated statistics for all ads
   */
  async getStatistics(): Promise<StatisticsResult> {
    const totalAds = await this.advertisementRepository.count();
    const activeAds = await this.advertisementRepository.count({
      where: { isActive: true },
    });

    // Get total impressions across all ads
    const totalImpressions: RawCountResult | undefined =
      await this.userAdViewRepository
        .createQueryBuilder('view')
        .select('COUNT(view.id)', 'total')
        .getRawOne();

    // Get total clicks across all ads
    const totalClicks: RawCountResult | undefined =
      await this.userAdViewRepository
        .createQueryBuilder('view')
        .select('COUNT(view.id)', 'total')
        .where('view.clicked = true')
        .getRawOne();

    // Safe conversion of possible null/undefined values
    const impressionsTotal =
      totalImpressions && 'total' in totalImpressions
        ? Number(totalImpressions.total) // .total is string | number from RawCountResult
        : 0;
    const clicksTotal =
      totalClicks && 'total' in totalClicks
        ? Number(totalClicks.total) // .total is string | number from RawCountResult
        : 0;

    const clickThroughRate =
      impressionsTotal > 0 ? (clicksTotal / impressionsTotal) * 100 : 0;

    return {
      totalAds,
      activeAds,
      impressions: impressionsTotal,
      clicks: clicksTotal,
      clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
    };
  }

  /**
   * Get statistics for a specific advertisement
   * @param adId - Advertisement ID
   * @returns Detailed statistics for the ad
   */
  async getAdStatistics(adId: number): Promise<AdStatisticsResult> {
    const ad = await this.findOne(adId);

    // Get total views and unique sessions/users
    const viewsQuery: RawViewsQueryResult | undefined =
      await this.userAdViewRepository
        .createQueryBuilder('view')
        .select('COUNT(view.id)', 'totalViews')
        .addSelect('COUNT(DISTINCT view.sessionId)', 'uniqueSessions')
        .addSelect('COUNT(DISTINCT view.userId)', 'uniqueUsers')
        .where('view.adId = :adId', { adId })
        .getRawOne();

    // Get clicks data
    const clicksQuery: RawClicksQueryResult | undefined =
      await this.userAdViewRepository
        .createQueryBuilder('view')
        .select('COUNT(view.id)', 'totalClicks')
        .addSelect('COUNT(DISTINCT view.sessionId)', 'uniqueSessionClicks')
        .addSelect('COUNT(DISTINCT view.userId)', 'uniqueUserClicks')
        .where('view.adId = :adId AND view.clicked = true', { adId })
        .getRawOne();

    // Calculate click-through rate (CTR)
    const totalViews = parseInt(
      String(
        viewsQuery && 'totalViews' in viewsQuery ? viewsQuery.totalViews : '0',
      ),
      10,
    );
    const totalClicks = parseInt(
      String(
        clicksQuery && 'totalClicks' in clicksQuery
          ? clicksQuery.totalClicks
          : '0',
      ),
      10,
    );
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // Get recent activity (last 10 interactions)
    const recentActivity = await this.userAdViewRepository.find({
      where: { adId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Get daily views and clicks for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivityRaw: RawDailyActivityResult[] =
      await this.userAdViewRepository
        .createQueryBuilder('view')
        .select('DATE(view.createdAt)', 'date')
        .addSelect('COUNT(view.id)', 'views')
        .addSelect(
          'SUM(CASE WHEN view.clicked = true THEN 1 ELSE 0 END)',
          'clicks',
        )
        .where('view.adId = :adId AND view.createdAt >= :startDate', {
          adId,
          startDate: thirtyDaysAgo,
        })
        .groupBy('DATE(view.createdAt)')
        .orderBy('DATE(view.createdAt)', 'ASC')
        .getRawMany();

    // Convert string values to numbers
    const dailyActivity = dailyActivityRaw.map((item) => ({
      date: item.date,
      views: parseInt(String(item.views || '0'), 10),
      clicks: parseInt(String(item.clicks || '0'), 10),
    }));

    return {
      id: ad.id,
      title: ad.title,
      status: ad.isActive ? 'Active' : 'Inactive',
      period: `${ad.startDate.toISOString().split('T')[0]} to ${ad.endDate.toISOString().split('T')[0]}`,
      impressions: ad.impressions,
      clicks: ad.clicks,
      ctr: parseFloat(ctr.toFixed(2)),
      details: {
        views: {
          total: totalViews,
          uniqueSessions: parseInt(
            String(
              viewsQuery && 'uniqueSessions' in viewsQuery
                ? viewsQuery.uniqueSessions
                : '0',
            ),
            10,
          ),
          uniqueUsers: parseInt(
            String(
              viewsQuery && 'uniqueUsers' in viewsQuery
                ? viewsQuery.uniqueUsers
                : '0',
            ),
            10,
          ),
        },
        clicks: {
          total: totalClicks,
          uniqueSessions: parseInt(
            String(
              clicksQuery && 'uniqueSessionClicks' in clicksQuery
                ? clicksQuery.uniqueSessionClicks
                : '0',
            ),
            10,
          ),
          uniqueUsers: parseInt(
            String(
              clicksQuery && 'uniqueUserClicks' in clicksQuery
                ? clicksQuery.uniqueUserClicks
                : '0',
            ),
            10,
          ),
        },
        recentActivity: recentActivity.map((activity) => ({
          timestamp: activity.createdAt,
          userId: activity.userId || '',
          sessionId: activity.sessionId || '',
          clicked: Boolean(activity.clicked),
          referrer: activity.referrer,
        })),
        dailyActivity,
      },
    };
  }
}
