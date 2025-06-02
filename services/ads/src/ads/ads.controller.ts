import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdsService } from './ads.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { AdImpressionDto } from './dto/ad-impression.dto';
import { AdClickDto } from './dto/ad-click.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StatisticsResult, AdStatisticsResult } from './ads.service';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() createAdvertisementDto: CreateAdvertisementDto) {
    return this.adsService.create(createAdvertisementDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(
    @Query('active') active?: string,
    @Query('location') location?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adsService.findAll({
      active: active === 'true',
      location,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('random')
  getRandomAd(@Query('location') location?: string) {
    return this.adsService.getRandomAd(location);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStatistics(): Promise<StatisticsResult> {
    return this.adsService.getStatistics();
  }

  @Get(':id/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdStatistics(@Param('id') id: string): Promise<AdStatisticsResult> {
    return this.adsService.getAdStatistics(+id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.adsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() updateAdvertisementDto: UpdateAdvertisementDto,
  ) {
    return this.adsService.update(+id, updateAdvertisementDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.adsService.remove(+id);
  }

  @Post('impression')
  recordImpression(@Body() impressionDto: AdImpressionDto) {
    return this.adsService.recordImpression(impressionDto);
  }

  @Post('click')
  recordClick(@Body() clickDto: AdClickDto): Promise<StatisticsResult> {
    return this.adsService.recordClick(clickDto);
  }
}
