import { PartialType } from '@nestjs/mapped-types';
import { CreateWarmupCampaignDto } from './create-warmup-campaign.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateWarmupCampaignDto extends PartialType(CreateWarmupCampaignDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
