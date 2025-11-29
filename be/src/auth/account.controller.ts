import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccountService } from './account.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccountExportRequestDto } from './dto/account-export-request.dto';
import { UserExportDto } from './dto/user-export.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('users')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest): Promise<UserProfileDto> {
    if (!req.user) {
      // JwtAuthGuard гарантира, че при липса или невалиден токен заявката няма да стигне дотук.
      throw new Error('Authenticated user not found in request context');
    }

    return this.accountService.getCurrentProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    return this.accountService.updateEmail(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/change-password')
  @HttpCode(200)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    await this.accountService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(204)
  async deleteMe(@Req() req: AuthenticatedRequest): Promise<void> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    await this.accountService.deleteAccount(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/export')
  @HttpCode(200)
  exportMe(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AccountExportRequestDto,
  ): Promise<UserExportDto> {
    if (!req.user) {
      throw new Error('Authenticated user not found in request context');
    }

    const requireCaptcha =
      process.env.ACCOUNT_EXPORT_REQUIRE_CAPTCHA === 'true';
    if (requireCaptcha && !dto.captchaToken) {
      throw new BadRequestException('captcha verification required');
    }

    return this.accountService.exportData(req.user.userId);
  }
}
