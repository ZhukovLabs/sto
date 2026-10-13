'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Checkbox, Input, RichTextEditor, Text, Textarea } from '@sto/ui';
import { apiSend } from '@/shared/api/client';
import { readProxyError, type NewsRow } from '@/lib/api';
import { PhotoField } from '@/shared/ui/PhotoField';

export interface NewsFormProps {
  /** Редактируемая новость; null — создание. */
  item: NewsRow | null;
  onBack: () => void;
  onSaved: () => void;
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string | null;
  isPublished: boolean;
}

function toForm(item: NewsRow | null): FormState {
  return {
    title: item?.title ?? '',
    slug: item?.slug ?? '',
    excerpt: item?.excerpt ?? '',
    content: item?.content ?? '',
    cover: item?.cover ?? null,
    isPublished: item?.isPublished ?? false,
  };
}

/** Загружает картинку для вставки в текст через BFF /api/uploads. */
async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/uploads', { method: 'POST', body: form });
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить изображение');
  }
  return ((await response.json()) as { url: string }).url;
}

/** Пустой редактор отдаёт '<p></p>' — проверяем наличие реального контента. */
function hasContent(html: string): boolean {
  const plain = html.replace(/<[^>]*>/g, '').trim();
  return plain !== '' || /<img[\s>]/i.test(html);
}

export function NewsForm({ item, onBack, onSaved }: NewsFormProps): React.JSX.Element {
  const [form, setForm] = useState<FormState>(() => toForm(item));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (): Promise<void> => {
    if (pending) {
      return;
    }
    const title = form.title.trim();
    if (title.length < 5 || title.length > 200) {
      setError('Заголовок: от 5 до 200 символов');
      return;
    }
    if (!hasContent(form.content)) {
      setError('Текст новости пустой');
      return;
    }
    const excerpt = form.excerpt.trim();
    if (excerpt.length > 300) {
      setError('Короткое описание: до 300 символов');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const slug = form.slug.trim();
      await apiSend(
        item === null ? '/api/news' : `/api/news/${item.id}`,
        item === null ? 'POST' : 'PATCH',
        {
          title,
          content: form.content,
          excerpt,
          cover: form.cover ?? '',
          isPublished: form.isPublished,
          ...(slug !== '' && slug !== item?.slug ? { slug } : {}),
        },
        'Не удалось сохранить новость',
      );
      onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить');
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border border-border bg-panel p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />К списку
        </Button>
        <Text variant="caption" color="dim" className="font-mono uppercase tracking-[0.08em]">
          {item === null ? 'новая новость' : `/news/${item.slug}`}
        </Text>
      </div>

      <Input
        id="news-title"
        label="Заголовок"
        placeholder="Зимняя подготовка: чек-лист"
        required
        maxLength={200}
        value={form.title}
        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="flex flex-col gap-5">
          <Input
            id="news-slug"
            label="Адрес страницы"
            placeholder="сгенерируется из заголовка"
            helper="Адрес вида /news/… К нему автоматически добавится отметка времени — ссылки не повторяются."
            value={form.slug}
            onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
          />
          <Textarea
            id="news-excerpt"
            label="Короткое описание"
            placeholder="Пара предложений для карточки в списке и соцсетей"
            rows={3}
            maxLength={300}
            value={form.excerpt}
            onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
          />
        </div>
        <PhotoField
          value={form.cover}
          onChange={(url) => setForm((prev) => ({ ...prev, cover: url }))}
          onRemove={() => setForm((prev) => ({ ...prev, cover: null }))}
        />
      </div>

      <RichTextEditor
        id="news-content"
        label="Текст новости"
        required
        minHeight="24rem"
        value={form.content}
        onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
        onUploadImage={uploadImage}
      />

      <Checkbox
        label="Показывать на сайте"
        checked={form.isPublished}
        onChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
      />

      {error !== null ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Отмена
        </Button>
        <Button type="submit" loading={pending}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
