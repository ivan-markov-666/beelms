import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AdminUserSummaryDto } from './dto/admin-user-summary.dto';

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
  ): Promise<AdminUserSummaryDto[]> {
    const safePage = page && page > 0 ? page : 1;
    const safePageSize = pageSize && pageSize > 0 ? pageSize : 20;

    const qb = this.usersRepo
      .createQueryBuilder('user')
      .orderBy('user.created_at', 'DESC')
      .skip((safePage - 1) * safePageSize)
      .take(safePageSize);

    const trimmedQ = q?.trim();
    if (trimmedQ) {
      qb.where('LOWER(user.email) LIKE :q', {
        q: `%${trimmedQ.toLowerCase()}%`,
      });
    }

    const users = await qb.getMany();
    return users.map((user) => this.toSummary(user));
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
