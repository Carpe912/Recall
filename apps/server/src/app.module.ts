import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { DocumentsModule } from './documents/documents.module'
import { FoldersModule } from './folders/folders.module'
import { FilesModule } from './files/files.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DocumentsModule,
    FoldersModule,
    FilesModule,
  ],
})
export class AppModule {}
