import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto'

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.folder.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, parentId: true, order: true, createdAt: true },
    })
  }

  create(dto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId || null,
      },
    })
  }

  async update(id: string, dto: UpdateFolderDto) {
    const folder = await this.prisma.folder.findUnique({ where: { id } })
    if (!folder) throw new NotFoundException('文件夹不存在')
    return this.prisma.folder.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId || null }),
      },
    })
  }

  async remove(id: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id } })
    if (!folder) throw new NotFoundException('文件夹不存在')
    // Move child docs to root
    await this.prisma.document.updateMany({ where: { folderId: id }, data: { folderId: null } })
    // Move child folders to parent
    await this.prisma.folder.updateMany({ where: { parentId: id }, data: { parentId: folder.parentId } })
    return this.prisma.folder.delete({ where: { id } })
  }
}
