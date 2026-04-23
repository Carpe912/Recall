import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { FoldersService } from './folders.service'
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Get()
  findAll() {
    return this.foldersService.findAll()
  }

  @Post()
  create(@Body() dto: CreateFolderDto) {
    return this.foldersService.create(dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFolderDto) {
    return this.foldersService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foldersService.remove(id)
  }
}
