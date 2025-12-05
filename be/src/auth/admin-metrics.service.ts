import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { User } from './user.entity';

export type MetricsOverview = {
  totalUsers: number;
  totalArticles: number;
  topArticles: Array<{ slug: string }>;
  usersChangePercentSinceLastMonth: number | null;
};

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async getOverview(): Promise<MetricsOverview> {
    const totalUsers = await this.usersRepo.count();

    const now = new Date();
    const startOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const totalUsersPrevMonth = await this.usersRepo.count({
      where: {
        createdAt: LessThan(startOfCurrentMonth),
      },
    });

    let usersChangePercentSinceLastMonth: number | null = null;

    if (totalUsersPrevMonth > 0) {
      usersChangePercentSinceLastMonth =
        ((totalUsers - totalUsersPrevMonth) / totalUsersPrevMonth) * 100;
    }

    return {
      totalUsers,
      totalArticles: 0,
      topArticles: [],
      usersChangePercentSinceLastMonth,
    };
  }
}
