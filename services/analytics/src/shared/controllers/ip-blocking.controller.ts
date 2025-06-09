import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IpBlockingService } from '../services/ip-blocking.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

/**
 * DTO for adding an IP to the blocklist
 */
class BlockIpDto {
  /**
   * The IP address to block
   */
  ip: string;

  /**
   * Optional duration for temporary block in milliseconds
   * If not provided, the default duration from config will be used
   */
  durationMs?: number;
}

/**
 * Controller for managing blocked IP addresses
 * Provides endpoints for viewing and manipulating the IP blocklist
 * Only accessible to users with administrator privileges
 */
@ApiTags('ip-blocking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/security/ip-blocking')
export class IpBlockingController {
  private readonly logger = new Logger(IpBlockingController.name);

  constructor(private readonly ipBlockingService: IpBlockingService) {}

  /**
   * Get a list of all currently blocked IPs
   */
  @Get('blocked')
  @ApiOperation({ summary: 'Get all blocked IP addresses' })
  @ApiResponse({
    status: 200,
    description:
      'List of all blocked IP addresses, both permanent and temporary',
  })
  getBlockedIps() {
    return {
      blockedIps: this.ipBlockingService.getBlockedIps(),
    };
  }

  /**
   * Permanently block an IP address
   */
  @Post('permanent')
  @ApiOperation({ summary: 'Add an IP to the permanent blocklist' })
  @ApiResponse({
    status: 201,
    description: 'IP successfully added to permanent blocklist',
  })
  blockIpPermanently(@Body() blockIpDto: BlockIpDto) {
    this.ipBlockingService.addToPermanentBlocklist(blockIpDto.ip);
    this.logger.log(`IP ${blockIpDto.ip} permanently blocked by admin request`);
    return { success: true, message: 'IP added to permanent blocklist' };
  }

  /**
   * Temporarily block an IP address
   */
  @Post('temporary')
  @ApiOperation({ summary: 'Add an IP to the temporary blocklist' })
  @ApiResponse({
    status: 201,
    description: 'IP successfully blocked temporarily',
  })
  blockIpTemporarily(@Body() blockIpDto: BlockIpDto) {
    this.ipBlockingService.blockTemporarily(
      blockIpDto.ip,
      blockIpDto.durationMs,
    );
    this.logger.log(
      `IP ${blockIpDto.ip} temporarily blocked for ${
        blockIpDto.durationMs ? blockIpDto.durationMs / 1000 : 'default'
      } seconds by admin request`,
    );
    return { success: true, message: 'IP temporarily blocked' };
  }

  /**
   * Remove an IP from the permanent blocklist
   */
  @Delete('permanent/:ip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an IP from the permanent blocklist' })
  @ApiResponse({
    status: 200,
    description: 'IP successfully removed from permanent blocklist',
  })
  unblockIpPermanently(@Param('ip') ip: string) {
    const removed = this.ipBlockingService.removeFromPermanentBlocklist(ip);
    this.logger.log(
      `IP ${ip} permanent block removal attempt by admin: ${removed ? 'successful' : 'not found'}`,
    );
    return {
      success: removed,
      message: removed
        ? 'IP removed from permanent blocklist'
        : 'IP was not in permanent blocklist',
    };
  }

  /**
   * Remove an IP from the temporary blocklist
   */
  @Delete('temporary/:ip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an IP from the temporary blocklist' })
  @ApiResponse({
    status: 200,
    description: 'IP successfully removed from temporary blocklist',
  })
  unblockIpTemporarily(@Param('ip') ip: string) {
    const removed = this.ipBlockingService.unblockTemporarily(ip);
    this.logger.log(
      `IP ${ip} temporary block removal attempt by admin: ${removed ? 'successful' : 'not found'}`,
    );
    return {
      success: removed,
      message: removed
        ? 'IP temporary block removed'
        : 'IP was not temporarily blocked',
    };
  }
}
