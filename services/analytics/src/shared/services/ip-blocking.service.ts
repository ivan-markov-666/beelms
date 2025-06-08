import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Options for IP blocking rules
 */
interface IpBlockingOptions {
  // Maximum number of failed requests before temporary block
  maxFailedRequests: number;
  
  // Duration of temporary block in milliseconds
  temporaryBlockDuration: number;
  
  // Time window for counting failed requests in milliseconds
  failureWindowMs: number;
  
  // Array of always-blocked IPs
  permanentlyBlockedIps: string[];
  
  // Array of whitelisted IPs that should never be blocked
  whitelistedIps: string[];
}

/**
 * Interface for storing IP address failure data
 */
interface IpFailureRecord {
  ip: string;
  failureCount: number;
  firstFailureTime: number;
  blockedUntil?: number;
}

/**
 * Service for managing blocked IP addresses
 * This service provides functionality to block suspicious IP addresses
 * based on failed attempts and manual blocklists
 */
@Injectable()
export class IpBlockingService {
  private readonly logger = new Logger(IpBlockingService.name);
  private readonly ipFailures: Map<string, IpFailureRecord> = new Map();
  private readonly options: IpBlockingOptions;
  
  constructor(private readonly configService: ConfigService) {
    // Set default options and override with environment variables if available
    this.options = {
      maxFailedRequests: this.configService.get<number>('IP_BLOCKING_MAX_FAILED_REQUESTS', 5),
      temporaryBlockDuration: this.configService.get<number>('IP_BLOCKING_TEMP_DURATION_MS', 3600000), // 1 hour
      failureWindowMs: this.configService.get<number>('IP_BLOCKING_WINDOW_MS', 300000), // 5 minutes
      permanentlyBlockedIps: this.parseArrayConfigValue('IP_BLOCKING_BLOCKLIST', []),
      whitelistedIps: this.parseArrayConfigValue('IP_BLOCKING_WHITELIST', ['127.0.0.1', '::1']),
    };

    this.logger.log(`IP Blocking service initialized with max ${this.options.maxFailedRequests} failures in ${this.options.failureWindowMs}ms`);
    if (this.options.permanentlyBlockedIps.length > 0) {
      this.logger.log(`Permanent blocklist contains ${this.options.permanentlyBlockedIps.length} IPs`);
    }
  }

  /**
   * Parse config value that should be a comma-separated string into an array
   */
  private parseArrayConfigValue(key: string, defaultValue: string[]): string[] {
    const value = this.configService.get<string>(key);
    if (!value) {
      return defaultValue;
    }
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  /**
   * Check if an IP is currently blocked
   * 
   * @param ip The IP address to check
   * @returns boolean indicating if the IP is blocked
   */
  public isBlocked(ip: string): boolean {
    // Always allow whitelisted IPs
    if (this.isWhitelisted(ip)) {
      return false;
    }

    // Check permanent blocklist
    if (this.isPermanentlyBlocked(ip)) {
      return true;
    }

    // Check temporary blocks
    const record = this.ipFailures.get(ip);
    if (record?.blockedUntil && record.blockedUntil > Date.now()) {
      return true;
    }

    // Clean up expired record if it exists
    if (record?.blockedUntil && record.blockedUntil <= Date.now()) {
      this.logger.debug(`Temporary block for IP ${ip} has expired`);
      record.blockedUntil = undefined;
    }

    return false;
  }

  /**
   * Check if an IP is permanently blocked
   * 
   * @param ip The IP address to check
   * @returns boolean indicating if the IP is permanently blocked
   */
  public isPermanentlyBlocked(ip: string): boolean {
    return this.options.permanentlyBlockedIps.includes(ip);
  }

  /**
   * Check if an IP is whitelisted
   * 
   * @param ip The IP address to check
   * @returns boolean indicating if the IP is whitelisted
   */
  public isWhitelisted(ip: string): boolean {
    return this.options.whitelistedIps.includes(ip);
  }

  /**
   * Add an IP address to the permanent blocklist
   * 
   * @param ip The IP address to permanently block
   */
  public addToPermanentBlocklist(ip: string): void {
    if (!this.options.permanentlyBlockedIps.includes(ip)) {
      this.options.permanentlyBlockedIps.push(ip);
      this.logger.warn(`IP ${ip} added to permanent blocklist`);
    }
  }

  /**
   * Remove an IP address from the permanent blocklist
   * 
   * @param ip The IP address to unblock
   * @returns boolean indicating if an IP was actually removed
   */
  public removeFromPermanentBlocklist(ip: string): boolean {
    const initialLength = this.options.permanentlyBlockedIps.length;
    this.options.permanentlyBlockedIps = this.options.permanentlyBlockedIps.filter(
      blockedIp => blockedIp !== ip
    );
    
    const wasRemoved = initialLength > this.options.permanentlyBlockedIps.length;
    
    if (wasRemoved) {
      this.logger.log(`IP ${ip} removed from permanent blocklist`);
    }
    
    return wasRemoved;
  }

  /**
   * Record a failed request from an IP
   * This increments the failure counter and may result in blocking the IP
   * 
   * @param ip The IP address with the failed request
   */
  public recordFailedRequest(ip: string): void {
    // Don't record failures for whitelisted IPs
    if (this.isWhitelisted(ip)) {
      return;
    }

    const now = Date.now();
    const existingRecord = this.ipFailures.get(ip);

    if (!existingRecord) {
      // This is the first failure for this IP
      this.ipFailures.set(ip, {
        ip,
        failureCount: 1,
        firstFailureTime: now,
      });
      return;
    }

    // Check if we should reset the counter (outside the failure window)
    if (now - existingRecord.firstFailureTime > this.options.failureWindowMs) {
      existingRecord.failureCount = 1;
      existingRecord.firstFailureTime = now;
      return;
    }

    // Increment failure counter
    existingRecord.failureCount++;

    // Check if we should block this IP
    if (existingRecord.failureCount >= this.options.maxFailedRequests) {
      existingRecord.blockedUntil = now + this.options.temporaryBlockDuration;
      this.logger.warn(
        `IP ${ip} temporarily blocked until ${new Date(existingRecord.blockedUntil).toISOString()} after ${existingRecord.failureCount} failures`
      );
    }
  }

  /**
   * Explicitly block an IP temporarily
   * 
   * @param ip The IP address to block
   * @param durationMs The duration to block for in milliseconds
   */
  public blockTemporarily(ip: string, durationMs = this.options.temporaryBlockDuration): void {
    if (this.isWhitelisted(ip)) {
      this.logger.debug(`Ignoring attempt to block whitelisted IP ${ip}`);
      return;
    }

    const now = Date.now();
    const existingRecord = this.ipFailures.get(ip) || {
      ip,
      failureCount: this.options.maxFailedRequests,
      firstFailureTime: now,
    };

    existingRecord.blockedUntil = now + durationMs;
    this.ipFailures.set(ip, existingRecord);
    
    this.logger.warn(
      `IP ${ip} manually blocked temporarily until ${new Date(existingRecord.blockedUntil).toISOString()}`
    );
  }

  /**
   * Unblock a temporarily blocked IP
   * 
   * @param ip The IP address to unblock
   * @returns boolean indicating if an IP was actually unblocked
   */
  public unblockTemporarily(ip: string): boolean {
    const record = this.ipFailures.get(ip);
    
    if (record && record.blockedUntil) {
      record.blockedUntil = undefined;
      record.failureCount = 0;
      this.logger.log(`IP ${ip} temporary block removed`);
      return true;
    }
    
    return false;
  }

  /**
   * Get all currently blocked IPs (both permanent and temporary)
   * 
   * @returns An array of IP addresses that are currently blocked
   */
  public getBlockedIps(): string[] {
    const now = Date.now();
    const temporarilyBlockedIps = Array.from(this.ipFailures.values())
      .filter(record => record.blockedUntil && record.blockedUntil > now)
      .map(record => record.ip);
    
    return [...this.options.permanentlyBlockedIps, ...temporarilyBlockedIps];
  }

  /**
   * Clean up expired temporary blocks
   * This can be called periodically to free up memory
   */
  public cleanupExpiredBlocks(): void {
    const now = Date.now();
    const expiredCount = Array.from(this.ipFailures.values())
      .filter(record => record.blockedUntil && record.blockedUntil <= now).length;

    if (expiredCount > 0) {
      this.ipFailures.forEach((record, ip) => {
        if (record.blockedUntil && record.blockedUntil <= now) {
          record.blockedUntil = undefined;
        }
      });
      this.logger.debug(`Cleaned up ${expiredCount} expired IP blocks`);
    }
  }
}
