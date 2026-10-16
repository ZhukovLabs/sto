'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from 'lucide-react';
import { FieldCaption, FieldLabel, fieldCaptionIds, fieldDescribedBy } from '../Field/field';

export interface RichTextEditorProps {
  /** Подпись над редактором. */
  label?: string;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** HTML-контент (контролируемый). */
  value: string;
  onChange: (html: string) => void;
  /** Загрузка изображения из тулбара: получает файл, возвращает URL. Без пропа кнопка изображения скрыта. */
  onUploadImage?: (file: File) => Promise<string>;
  /** Минимальная высота области текста. */
  minHeight?: string;
  id?: string;
  className?: string;
}

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  h2: boolean;
  h3: boolean;
  bullet: boolean;
  ordered: boolean;
  quote: boolean;
  link: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLBAR_BUTTON_CLASS =
  'flex size-8 items-center justify-center rounded text-content-muted transition-colors hover:bg-panel-2 hover:text-content disabled:pointer-events-none disabled:opacity-40';

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`${TOOLBAR_BUTTON_CLASS} ${active ? 'bg-panel-2 text-content' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider(): React.JSX.Element {
  return <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

export function RichTextEditor({
  label,
  helper,
  error,
  required,
  disabled = false,
  value,
  onChange,
  onUploadImage,
  minHeight = '18rem',
  id,
  className = '',
}: RichTextEditorProps): React.JSX.Element {
  // useId всегда наверху: условный вызов хука (id ?? useId()) роняет React при смене id.
  const generatedId = useId();
  const editorId = id ?? generatedId;
  const { helperId, errorId } = fieldCaptionIds(editorId);
  const [linkDraftOpen, setLinkDraftOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState('https://');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Аплоад переживает закрытие формы: не трогаем state размонтированного компонента.
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  // onChange приходит новым замыканием на каждый рендер родителя — держим актуальный в ref.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Image,
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChangeRef.current(current.getHTML()),
    // Лейбл и подписи вешаем на сам contenteditable - он и есть поле формы.
    editorProps: {
      attributes: {
        id: editorId,
        role: 'textbox',
        'aria-multiline': 'true',
        ...(fieldDescribedBy(error, helper, errorId, helperId) !== undefined
          ? { 'aria-describedby': fieldDescribedBy(error, helper, errorId, helperId) }
          : {}),
        ...(error ? { 'aria-invalid': 'true' as const } : {}),
      },
    },
  });

  // Синхронизация внешнего value (сброс формы, загрузка другой новости).
  useEffect(() => {
    if (editor !== null && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor !== null) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }): ToolbarState | null =>
      current === null
        ? null
        : {
            bold: current.isActive('bold'),
            italic: current.isActive('italic'),
            strike: current.isActive('strike'),
            h2: current.isActive('heading', { level: 2 }),
            h3: current.isActive('heading', { level: 3 }),
            bullet: current.isActive('bulletList'),
            ordered: current.isActive('orderedList'),
            quote: current.isActive('blockquote'),
            link: current.isActive('link'),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          },
  });

  const run = (action: (chain: ReturnType<Editor['chain']>) => unknown): void => {
    if (editor === null || editor.isDestroyed) {
      return;
    }
    action(editor.chain().focus());
  };

  const applyLink = (): void => {
    const href = linkDraft.trim();
    if (href === '' || href === 'https://') {
      return;
    }
    run((chain) =>
      chain
        .extendMarkRange('link')
        .setLink({ href: /^https?:\/\//.test(href) ? href : `https://${href}` })
        .run(),
    );
    setLinkDraftOpen(false);
  };

  const onPickImage = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined || onUploadImage === undefined) {
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const url = await onUploadImage(file);
      run((chain) =>
        chain.setImage({ src: url, alt: file.name.replace(/\.[a-z0-9]+$/i, '') }).run(),
      );
    } catch (uploadFailure) {
      if (mountedRef.current) {
        setUploadError(
          uploadFailure instanceof Error
            ? uploadFailure.message
            : 'Не удалось загрузить изображение',
        );
      }
    } finally {
      if (mountedRef.current) {
        setUploading(false);
      }
    }
  };

  const caption = (
    <FieldCaption error={error} helper={helper} errorId={errorId} helperId={helperId} />
  );

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      {label ? <FieldLabel htmlFor={editorId} label={label} required={required} /> : null}
      <div
        aria-describedby={fieldDescribedBy(error, helper, errorId, helperId)}
        aria-invalid={error ? true : undefined}
        className={[
          'w-full overflow-hidden rounded-lg border bg-panel transition-colors duration-150',
          error
            ? 'border-danger'
            : 'border-border hover:border-border-strong focus-within:border-primary',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 focus-within:ring-offset-bg',
          disabled ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        <div
          role="toolbar"
          aria-label="Форматирование текста"
          className="flex flex-wrap items-center gap-0.5 border-b border-border bg-panel-2/50 px-2 py-1.5"
        >
          <ToolbarButton
            label="Отменить"
            disabled={disabled || state === null || !state.canUndo}
            onClick={() => run((chain) => chain.undo().run())}
          >
            <Undo2 className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Повторить"
            disabled={disabled || state === null || !state.canRedo}
            onClick={() => run((chain) => chain.redo().run())}
          >
            <Redo2 className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            label="Жирный"
            active={state?.bold}
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.toggleBold().run())}
          >
            <Bold className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Курсив"
            active={state?.italic}
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.toggleItalic().run())}
          >
            <Italic className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Зачёркнутый"
            active={state?.strike}
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.toggleStrike().run())}
          >
            <Strikethrough className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            label="Заголовок секции"
            active={state?.h2}
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.toggleHeading({ level: 2 }).run())}
          >
            <Heading2 className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Подзаголовок"
            active={state?.h3}
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.toggleHeading({ level: 3 }).run())}
          >
            <Heading3 className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            label="Маркированный список"
            active={state?.bullet}
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.toggleBulletList().run())}
          >
            <List className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Нумерованный список"
            active={state?.ordered}
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.toggleOrderedList().run())}
          >
            <ListOrdered className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Цитата"
            active={state?.quote}
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.toggleBlockquote().run())}
          >
            <Quote className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Разделитель"
            disabled={disabled || state === null}
            onClick={() => run((chain) => chain.setHorizontalRule().run())}
          >
            <Minus className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            label="Ссылка"
            active={linkDraftOpen || state?.link}
            disabled={disabled || state === null}
            onClick={() => {
              setLinkDraftOpen((open) => !open);
              // Редактируем существующую ссылку, а не начинаем с нуля.
              const href = editor?.getAttributes('link').href;
              setLinkDraft(typeof href === 'string' && href !== '' ? href : 'https://');
            }}
          >
            <Link2 className="size-4" aria-hidden="true" />
          </ToolbarButton>
          {state?.link ? (
            <ToolbarButton
              label="Убрать ссылку"
              disabled={disabled || state === null}
              onClick={() => run((chain) => chain.extendMarkRange('link').unsetLink().run())}
            >
              <Unlink className="size-4" aria-hidden="true" />
            </ToolbarButton>
          ) : null}
          {onUploadImage !== undefined ? (
            <ToolbarButton
              label="Изображение"
              disabled={disabled || uploading || editor === null}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-4" aria-hidden="true" />
              )}
            </ToolbarButton>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,image/jpeg,image/png"
            className="hidden"
            onChange={(event) => void onPickImage(event)}
          />
        </div>
        {linkDraftOpen ? (
          <div className="flex items-center gap-2 border-b border-border bg-panel-2/30 px-3 py-2">
            <input
              type="url"
              inputMode="url"
              aria-label="Адрес ссылки"
              placeholder="https://promaks.by"
              value={linkDraft}
              onChange={(event) => setLinkDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyLink();
                }
                if (event.key === 'Escape') {
                  setLinkDraftOpen(false);
                }
              }}
              autoFocus
              className="h-8 w-full max-w-sm rounded border border-border bg-panel px-2 text-caption text-content outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={applyLink}
              className="h-8 shrink-0 rounded bg-primary px-3 text-caption font-bold text-primary-ink transition-colors hover:bg-primary-hover"
            >
              Вставить
            </button>
            <button
              type="button"
              onClick={() => setLinkDraftOpen(false)}
              className="h-8 shrink-0 rounded px-3 text-caption text-content-muted transition-colors hover:bg-panel-2 hover:text-content"
            >
              Отмена
            </button>
          </div>
        ) : null}
        <EditorContent
          editor={editor}
          style={{ minHeight }}
          className="rich-content flex flex-col px-4 py-3 [&_.ProseMirror]:flex-1 [&_.ProseMirror]:outline-none"
        />
      </div>
      {uploadError !== null ? (
        <span className="text-caption text-danger">{uploadError}</span>
      ) : caption ? (
        caption
      ) : null}
    </div>
  );
}
