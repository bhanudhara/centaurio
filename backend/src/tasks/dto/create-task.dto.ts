import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { TaskPriority, TaskStatus } from '../task.entity.js';

export class CreateTaskDto {
  @IsString()
  @MaxLength(140)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'done'])
  status?: TaskStatus;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({ strict: true })
  dueDate?: string | null;
}