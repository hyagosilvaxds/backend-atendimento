import { IsString, IsArray, IsOptional, IsInt, Min, Max } from 'class-validator';

export class AddContactsToCampaignDto {
  @IsArray()
  @IsString({ each: true })
  contactIds: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number = 1;
}

export class AddSessionsToCampaignDto {
  @IsArray()
  @IsString({ each: true })
  sessionIds: string[];
}
