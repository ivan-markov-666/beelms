import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type InstanceBranding = {
  appName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
};

export type InstanceFeatures = {
  wikiPublic: boolean;
  courses: boolean;
  auth: boolean;
  paidCourses: boolean;
  gdprLegal: boolean;
  socialGoogle: boolean;
  socialFacebook: boolean;
  socialGithub: boolean;
  socialLinkedin: boolean;
  infraRedis: boolean;
  infraRabbitmq: boolean;
  infraMonitoring: boolean;
  infraErrorTracking: boolean;
};

export type InstanceLanguages = {
  supported: string[];
  default: string;
};

@Entity('instance_config')
export class InstanceConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  branding: InstanceBranding;

  @Column({ type: 'jsonb' })
  features: InstanceFeatures;

  @Column({ type: 'jsonb' })
  languages: InstanceLanguages;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
