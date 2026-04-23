import { IsString, IsOptional, IsIn } from 'class-validator'

export class CreateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  @IsIn(['prose', 'whiteboard'])
  type?: string

  @IsString()
  @IsOptional()
  folderId?: string
}

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsString()
  @IsOptional()
  folderId?: string
}
