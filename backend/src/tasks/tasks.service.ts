import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './task.entity.js';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private readonly tasks: Repository<Task>) {}

  findAll() {
    return this.tasks.find({ order: { createdAt: 'DESC' } });
  }

  create(input: CreateTaskDto) {
    return this.tasks.save(this.tasks.create(input));
  }

  async update(id: string, input: UpdateTaskDto) {
    const task = await this.tasks.preload({ id, ...input });
    if (!task) throw new NotFoundException('Task not found');
    return this.tasks.save(task);
  }

  async remove(id: string) {
    const result = await this.tasks.delete(id);
    if (!result.affected) throw new NotFoundException('Task not found');
    return { deleted: true };
  }
}