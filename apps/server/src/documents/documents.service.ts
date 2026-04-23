import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto'

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  findAll(folderId?: string) {
    return this.prisma.document.findMany({
      where: folderId !== undefined ? { folderId: folderId || null } : undefined,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, title: true, type: true, folderId: true, order: true, createdAt: true, updatedAt: true },
    })
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException('文档不存在')
    return doc
  }

  create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        title: dto.title || '无标题',
        type: dto.type || 'prose',
        folderId: dto.folderId || null,
      },
    })
  }

  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id)
    return this.prisma.document.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.folderId !== undefined && { folderId: dto.folderId || null }),
      },
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.document.delete({ where: { id } })
  }
}
