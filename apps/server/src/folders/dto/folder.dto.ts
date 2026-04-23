import { IsString, IsOptional } from 'class-validator'

export class CreateFolderDto {
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  parentId?: string
}

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  parentId?: string
}
