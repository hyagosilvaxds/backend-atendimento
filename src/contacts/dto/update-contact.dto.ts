import { IsOptional } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateContactDto extends PartialType(CreateContactDto) {}
