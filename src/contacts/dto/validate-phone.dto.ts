import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ValidatePhoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d\s\-\(\)\+]+$/, {
    message: 'Telefone deve conter apenas números, espaços, parênteses, hífens ou sinal de mais'
  })
  phone: string;
}
