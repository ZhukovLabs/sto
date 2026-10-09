'use client';

import { useRef, useState } from 'react';
import { Button, Text } from '@sto/ui';
import { readProxyError } from '@/lib/api';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Загружает фото в @sto/api и показывает превью. value — url ('/uploads/…' или '/services/…'). */
export function PhotoField({
  value,
  onChange,
  onRemove,
}: {
  value: string | null;
  onChange: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<void> => {
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Файл больше 5 МБ — выберите файл поменьше');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/uploads', { method: 'POST', body: form });
      if (!response.ok) {
        throw await readProxyError(response, 'Не удалось загрузить файл');
      }
      const body = (await response.json()) as { url: string };
      onChange(body.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить файл');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
        Фото
      </span>
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 overflow-hidden rounded-md border border-border bg-panel-2">
          {value !== null ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center font-mono text-caption text-content-dim">
              —
            </span>
          )}
        </span>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/webp,image/jpeg,image/png"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file !== undefined) {
                void upload(file);
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={pending}
              onClick={() => inputRef.current?.click()}
            >
              {value === null ? 'Загрузить' : 'Заменить'}
            </Button>
            {value !== null ? (
              <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                Убрать
              </Button>
            ) : null}
          </div>
          <Text variant="micro" color="dim">
            WEBP · JPEG · PNG · ДО 5 МБ
          </Text>
        </div>
      </div>
      {error !== null ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
