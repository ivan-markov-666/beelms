import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from './user.entity';
import { AdminUserSummaryDto } from './dto/admin-user-summary.dto';
import { AdminUsersStatsDto } from './dto/admin-users-stats.dto';
import { USER_ROLES, type UserRole } from './user-role';
import type { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private buildAdminUsersQuery(options: {
    q?: string;
    status?: 'active' | 'deactivated';
    role?: UserRole;
  }) {
    const qb = this.usersRepo
      .createQueryBuilder('user')
      .orderBy('user.created_at', 'DESC');

    let hasConditions = false;

    const trimmedQ = options.q?.trim();
    if (trimmedQ) {
      qb.where('LOWER(user.email) LIKE :q', {
        q: `%${trimmedQ.toLowerCase()}%`,
      });
      hasConditions = true;
    }

    if (options.status === 'active') {
      if (hasConditions) {
        qb.andWhere('user.active = :active', { active: true });
      } else {
        qb.where('user.active = :active', { active: true });
        hasConditions = true;
      }
    } else if (options.status === 'deactivated') {
      if (hasConditions) {
        qb.andWhere('user.active = :active', { active: false });
      } else {
        qb.where('user.active = :active', { active: false });
        hasConditions = true;
      }
    }

    const role = options.role;
    if (role && USER_ROLES.includes(role)) {
      if (hasConditions) {
        qb.andWhere('user.role = :role', { role });
      } else {
        qb.where('user.role = :role', { role });
      }
    }

    return qb;
  }

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
    role?: UserRole,
  ): Promise<AdminUserSummaryDto[]> {
    const result = await this.getAdminUsersListPaged(
      page,
      pageSize,
      q,
      status,
      role,
    );
    return result.items;
  }

  async getAdminUsersListPaged(
    page?: number,
    pageSize?: number,
    q?: string,
    status?: 'active' | 'deactivated',
    role?: UserRole,
  ): Promise<{ items: AdminUserSummaryDto[]; total: number }> {
    const safePage = page && page > 0 ? page : 1;
    const safePageSize =
      pageSize && pageSize > 0 ? Math.min(pageSize, 100) : 20;

    const qb = this.buildAdminUsersQuery({ q, status, role })
      .skip((safePage - 1) * safePageSize)
      .take(safePageSize);

    const [users, total] = await qb.getManyAndCount();
    return { items: users.map((user) => this.toSummary(user)), total };
  }

  async exportAdminUsersCsv(options: {
    q?: string;
    status?: 'active' | 'deactivated';
    role?: UserRole;
  }): Promise<{ csv: string; filename: string }> {
    const qb = this.buildAdminUsersQuery(options);
    const users = await qb.getMany();

    const escapeCsv = (value: string | number): string => {
      const str = String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replaceAll('"', '""')}"`;
      }
      return str;
    };

    const header = ['id', 'email', 'role', 'active', 'createdAt'];
    const rows = users.map((u) => [
      u.id,
      u.email,
      u.role,
      u.active ? 'true' : 'false',
      (u.createdAt ?? new Date()).toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(escapeCsv).join(','))
      .join('\n');

    const filename = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    return { csv, filename };
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

  async updateUser(
    id: string,
    dto: AdminUpdateUserDto,
    actorUserId?: string,
  ): Promise<AdminUserSummaryDto> {
    if (dto.active === undefined && dto.role === undefined) {
      throw new BadRequestException('No changes provided');
    }

    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.role !== undefined) {
      const nextRole = dto.role;

      if (!USER_ROLES.includes(nextRole)) {
        throw new BadRequestException('Invalid role');
      }

      if (actorUserId && actorUserId === user.id && nextRole !== 'admin') {
        throw new ForbiddenException('Cannot change own role');
      }

      user.role = nextRole;
    }

    if (dto.active !== undefined) {
      user.active = dto.active;
    }

    const saved = await this.usersRepo.save(user);

    return this.toSummary(saved);
  }

  async getTotalUsersCount(actorUserId?: string): Promise<number> {
    if (actorUserId) {
      return this.usersRepo.count({ where: { id: Not(actorUserId) } });
    }
    return this.usersRepo.count();
  }

  async bulkDeleteUsers(ids: string[], actorUserId?: string): Promise<number> {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()))).filter(
      (id) => id.length > 0,
    );
    if (uniqueIds.length === 0) {
      return 0;
    }

    if (actorUserId && uniqueIds.includes(actorUserId)) {
      throw new BadRequestException('Cannot delete own user');
    }

    const filteredIds = actorUserId
      ? uniqueIds.filter((id) => id !== actorUserId)
      : uniqueIds;
    if (filteredIds.length === 0) {
      return 0;
    }

    const result = await this.usersRepo.delete({ id: In(filteredIds) });
    return result.affected ?? 0;
  }

  async purgeAllUsers(actorUserId?: string): Promise<number> {
    const qb = this.usersRepo.createQueryBuilder().delete().from(User);

    if (actorUserId) {
      qb.where('id <> :actorUserId', { actorUserId });
    }

    const result = await qb.execute();
    return result.affected ?? 0;
  }
}
