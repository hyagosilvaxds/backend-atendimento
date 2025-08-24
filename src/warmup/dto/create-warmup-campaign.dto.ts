import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateWarmupCampaignDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  dailyMessageGoal?: number = 50;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  minIntervalMinutes?: number = 30;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  maxIntervalMinutes?: number = 180;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  workingHourStart?: number = 8;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  workingHourEnd?: number = 18;

  @IsOptional()
  @IsBoolean()
  useWorkingHours?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowWeekends?: boolean = false;

  @IsOptional()
  @IsBoolean()
  randomizeMessages?: boolean = true;

  @IsOptional()
  @IsBoolean()
  randomizeInterval?: boolean = true;

  @IsOptional()
  @IsBoolean()
  enableInternalConversations?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  internalConversationRatio?: number = 0.2;

  @IsOptional()
  @IsBoolean()
  enableAutoPauses?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  maxPauseTimeMinutes?: number = 30;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  minConversationTimeMinutes?: number = 20;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sessionIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactIds?: string[];
}
