import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadsController } from './uploads.controller';
import { UploadsS3Controller } from './uploads-s3.controller';

@Module({
  imports: [AuthModule],
  controllers: [UploadsController, UploadsS3Controller],
})
export class UploadsModule {}
