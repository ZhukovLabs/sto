import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  Controller,
  ExceptionFilter,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { diskStorage, MulterError } from 'multer';
import { BearerTokenGuard } from '../auth/bearer-token.guard';
import { UPLOAD_MIME_TYPES, UPLOAD_MAX_BYTES, uploadsDir } from './storage';

class UploadResponse {
  @ApiProperty({ example: '/uploads/8f0c1a2b-4d3e-4f5a-9b6c-1d2e3f4a5b6c.webp' })
  url!: string;
}

/** Multer-ошибки (превышен размер и т.п.) по умолчанию становятся 500 — превращаем в 400 с понятным текстом. */
@Catch(MulterError)
export class MulterErrorFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? `Файл больше ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)} МБ`
        : 'Не удалось принять файл';
    const response = host
      .switchToHttp()
      .getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    response.status(400).json({ statusCode: 400, message, error: 'Bad Request' });
  }
}

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(BearerTokenGuard)
@UseFilters(MulterErrorFilter)
@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => callback(null, uploadsDir()),
        filename: (_req, file, callback) =>
          callback(null, `${randomUUID()}.${UPLOAD_MIME_TYPES[file.mimetype]}`),
      }),
      limits: { fileSize: UPLOAD_MAX_BYTES, files: 1 },
      fileFilter: (_req, file, callback) => {
        if (UPLOAD_MIME_TYPES[file.mimetype] === undefined) {
          callback(new BadRequestException('Файл должен быть webp, jpeg или png'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: UploadResponse })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Загрузить фото (до 5 МБ, webp/jpeg/png)' })
  async upload(@UploadedFile() file: Express.Multer.File | undefined): Promise<UploadResponse> {
    if (file === undefined) {
      throw new BadRequestException('Файл не передан (поле file)');
    }
    return { url: `/uploads/${file.filename}` };
  }
}
