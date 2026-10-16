-- Ссылка на первоисточник для автоновостей из RSS (уникальна — защита от дублей).
ALTER TABLE "News" ADD COLUMN "sourceUrl" TEXT;
CREATE UNIQUE INDEX "News_sourceUrl_key" ON "News"("sourceUrl");
