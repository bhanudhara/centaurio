import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll() {
    return this.tasks.findAll();
  }

  @Post()
  create(@Body() input: CreateTaskDto) {
    return this.tasks.create(input);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateTaskDto) {
    return this.tasks.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.remove(id);
  }
}