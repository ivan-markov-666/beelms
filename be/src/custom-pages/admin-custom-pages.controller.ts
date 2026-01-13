import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CustomPagesService, type CustomPageDto } from './custom-pages.service';
import { AdminCreateCustomPageDto } from './dto/admin-create-custom-page.dto';
import { AdminUpdateCustomPageDto } from './dto/admin-update-custom-page.dto';

@Controller('admin/custom-pages')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCustomPagesController {
  constructor(private readonly customPagesService: CustomPagesService) {}

  @Get()
  list(): Promise<CustomPageDto[]> {
    return this.customPagesService.adminList();
  }

  @Post()
  create(@Body() dto: AdminCreateCustomPageDto): Promise<CustomPageDto> {
    return this.customPagesService.adminCreate(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateCustomPageDto,
  ): Promise<CustomPageDto> {
    return this.customPagesService.adminUpdate(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ ok: true }> {
    await this.customPagesService.adminDelete(id);
    return { ok: true };
  }
}
