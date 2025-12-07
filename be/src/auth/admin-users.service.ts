import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AdminUserSummaryDto } from './dto/admin-user-summary.dto';
import { AdminUsersStatsDto } from './dto/admin-users-stats.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private toSummary(user: User): AdminUserSummaryDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getAdminUsersList(
    page?: number,
    pageSize?: number,
    q?: string,
    status?: 'active' | 'deactivated',
    role?: 'user' | 'admin',
  ): Promise<AdminUserSummaryDto[]> {
    const safePage = page && page > 0 ? page : 1;
    const safePageSize = pageSize && pageSize > 0 ? pageSize : 20;

    const qb = this.usersRepo
      .createQueryBuilder('user')
      .orderBy('user.created_at', 'DESC')
      .skip((safePage - 1) * safePageSize)
      .take(safePageSize);

    let hasConditions = false;

    const trimmedQ = q?.trim();
    if (trimmedQ) {
      qb.where('LOWER(user.email) LIKE :q', {
        q: `%${trimmedQ.toLowerCase()}%`,
      });
      hasConditions = true;
    }

    if (status === 'active') {
      if (hasConditions) {
        qb.andWhere('user.active = :active', { active: true });
      } else {
        qb.where('user.active = :active', { active: true });
        hasConditions = true;
      }
    } else if (status === 'deactivated') {
      if (hasConditions) {
        qb.andWhere('user.active = :active', { active: false });
      } else {
        qb.where('user.active = :active', { active: false });
        hasConditions = true;
      }
    }

    if (role === 'admin' || role === 'user') {
      if (hasConditions) {
        qb.andWhere('user.role = :role', { role });
      } else {
        qb.where('user.role = :role', { role });
        hasConditions = true;
      }
    }

    const users = await qb.getMany();
    return users.map((user) => this.toSummary(user));
  }

  async getAdminUsersStats(): Promise<AdminUsersStatsDto> {
    const totalUsers = await this.usersRepo.count();
    const activeUsers = await this.usersRepo.count({ where: { active: true } });
    const adminUsers = await this.usersRepo.count({ where: { role: 'admin' } });
    const deactivatedUsers = totalUsers - activeUsers;

    return {
      totalUsers,
      activeUsers,
      deactivatedUsers,
      adminUsers,
    };
  }

  async updateUserActive(
    id: string,
    active: boolean,
  ): Promise<AdminUserSummaryDto> {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.active = active;
    const saved = await this.usersRepo.save(user);

    return this.toSummary(saved);
  }
}
