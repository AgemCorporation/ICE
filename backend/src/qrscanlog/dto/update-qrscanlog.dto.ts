import { PartialType } from '@nestjs/mapped-types';
import { CreateQrscanlogDto } from './create-qrscanlog.dto';

export class UpdateQrscanlogDto extends PartialType(CreateQrscanlogDto) {}
