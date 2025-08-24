import { IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateAutoReadSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoReadEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(300)
  autoReadInterval?: number; // Intervalo em segundos (5 segundos a 5 minutos)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  autoReadMinDelay?: number; // Delay mínimo em segundos

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  autoReadMaxDelay?: number; // Delay máximo em segundos (até 5 minutos)
}
