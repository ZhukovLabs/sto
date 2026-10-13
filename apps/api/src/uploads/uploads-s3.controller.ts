import { Controller, Get, NotFoundException, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { s3GetImage, s3KeyForUrl } from './s3';

/**
 * Публичная раздача /uploads/*: локальную статику отдаёт express (useStaticAssets
 * в main.ts), этот маршрут подхватывает промахи - файлы, которые живут в S3
 * (обложки автоновостей). URL-пространство одно, поэтому вебу и админке ничего
 * менять не нужно.
 */
@ApiTags('uploads')
@Controller('uploads')
export class UploadsS3Controller {
  @Get('*splat')
  @ApiExcludeEndpoint()
  async serve(
    @Param('splat') splat: string | string[],
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    // Express 5 отдаёт wildcard сегментами массивом: ['news', 'cover.jpg'].
    const path = Array.isArray(splat) ? splat.filter(Boolean).join('/') : splat;
    const key = s3KeyForUrl(`/uploads/${path}`);
    if (key === null) {
      throw new NotFoundException('Файл не найден');
    }
    const object = await s3GetImage(key);
    if (object === null) {
      throw new NotFoundException('Файл не найден');
    }
    // Имена файлов - uuid: содержимое неизменно, кешируем агрессивно.
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Content-Type', object.contentType);
    return new StreamableFile(object.body);
  }
}
