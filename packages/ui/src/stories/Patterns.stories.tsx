import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Heading,
  Input,
  Pill,
  PriceTag,
  SectionTitle,
  Select,
  Text,
  Textarea,
} from '../index';

const meta: Meta = {
  title: 'Patterns/Из чего строится сайт',
  parameters: { layout: 'padded' },
};
export default meta;

export const FormZayavka: StoryObj = {
  name: 'Форма «Записаться»',
  render: () => (
    <Card padding="lg" className="max-w-md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <Heading variant="h3">Записаться на сервис</Heading>
          <Text variant="body">Перезвоним в течение 15 минут и согласуем время.</Text>
        </div>
        <Input label="Ваше имя" placeholder="Как к вам обращаться" required />
        <Input label="Телефон" placeholder="+375 (__) ___-__-__" inputMode="tel" required />
        <Select
          label="Услуга"
          placeholder="Выберите услугу"
          options={[
            { value: 'diag', label: 'Диагностика подвески' },
            { value: 'oil', label: 'Замена масла' },
            { value: 'brakes', label: 'Замена колодок' },
          ]}
        />
        <Textarea
          label="Что с машиной"
          placeholder="Например: скрип при торможении"
          helper="Не обязательно, но поможет подготовиться"
        />
        <Checkbox
          label="Согласен на обработку персональных данных"
          description="Отмечая пункт, вы принимаете политику конфиденциальности"
        />
        <Button size="lg" fullWidth>
          Отправить заявку
        </Button>
      </div>
    </Card>
  ),
};

export const ServiceCard: StoryObj = {
  name: 'Карточка услуги',
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
      <Card interactive padding="lg">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-accent-500/12 text-accent-400">
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path
                  d="M12 3v10m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <Badge variant="accent-soft" size="sm">
              хит
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <Heading variant="h4">Диагностика подвески</Heading>
            <Text variant="body">
              Проверим все узлы на подъёмнике и покажем изношенные детали руками.
            </Text>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <PriceTag value="0" suffix="р." highlight />
            <Button variant="ghost" size="sm">
              Подробнее →
            </Button>
          </div>
        </div>
      </Card>
      <Card interactive padding="lg">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-accent-500/12 text-accent-400">
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 8v4l3 2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <Badge variant="success" size="sm" dot>
              свободно
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <Heading variant="h4">Замена масла</Heading>
            <Text variant="body">Масло и фильтр подберём под ваш двигатель. 20–30 минут.</Text>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <PriceTag prefix="от" value="15" suffix="р." />
            <Button variant="ghost" size="sm">
              Подробнее →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  ),
};

export const HeroFragment: StoryObj = {
  name: 'Фрагмент героя',
  render: () => (
    <div className="flex max-w-3xl flex-col items-start gap-6 py-8">
      <Badge variant="accent-soft" dot>
        открываемся в ноябре
      </Badge>
      <Heading variant="display-md" font="display" balance>
        Ремонт без сюрпризов
      </Heading>
      <Text variant="lead" className="max-w-xl">
        Сначала диагностика и смета — вы точно знаете цену до начала работ. Первым 20 клиентам —
        бесплатно.
      </Text>
      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg">Записаться</Button>
        <Button variant="secondary" size="lg">
          Заказать звонок
        </Button>
      </div>
      <Divider label="или напишите в мессенджер" />
      <div className="flex flex-wrap gap-2">
        <Pill>Telegram</Pill>
        <Pill>Viber</Pill>
        <Pill>WhatsApp</Pill>
      </div>
    </div>
  ),
};

export const MasterCard: StoryObj = {
  name: 'Карточка мастера',
  render: () => (
    <Card padding="lg" className="flex max-w-md items-center gap-5">
      <Avatar name="Максим Шнакс" size="xl" status="online" />
      <div className="flex flex-col gap-1">
        <Heading variant="h4">Максим — владелец и мастер</Heading>
        <Text variant="body">
          12+ лет за руём подъёмника. Лично подписывает каждый заказ-наряд.
        </Text>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="neutral" size="sm">
            12+ лет опыта
          </Badge>
          <Badge variant="neutral" size="sm">
            гарантия 6 мес
          </Badge>
        </div>
      </div>
    </Card>
  ),
};

export const SectionHeaderDemo: StoryObj = {
  name: 'Заголовки секций',
  render: () => (
    <div className="flex max-w-2xl flex-col gap-10">
      <SectionTitle
        eyebrow="услуги и цены"
        title="Стоимость работ"
        description="Цена фиксируется в смете до начала ремонта и не меняется."
      />
      <SectionTitle title="Как мы работаем" align="center" variant="h2" />
    </div>
  ),
};
