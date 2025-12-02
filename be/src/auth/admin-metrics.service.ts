import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export type MetricsOverview = {
  totalUsers: number;
  totalArticles: number;
  topArticles: Array<{ slug: string }>;
};

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async getOverview(): Promise<MetricsOverview> {
    const totalUsers = await this.usersRepo.count();

    // For WS-5 we only require totalUsers to be correct. Other fields
    // can be kept at 0/empty and evolved in future WS.
    return {
      totalUsers,
      totalArticles: 0,
      topArticles: [],
    };
  }
}
