import type { TeamMember, TrustFact } from './types';

export const TEAM: TeamMember[] = [
  {
    name: 'Максим',
    role: 'Владелец · мастер',
    spec: 'Принимает машину, считает смету, отвечает за гарантию',
    photo: '/master/portrait.webp',
    photoAlt: 'Максим — владелец автосервиса «ПроМакс»',
  },
  {
    name: 'Сергей',
    role: 'Мастер-моторист',
    spec: 'Двигатели, ГРМ, система охлаждения',
    photo: '/master/master2.webp',
    photoAlt: 'Сергей — мастер-моторист «ПроМакс»',
  },
  {
    name: 'Андрей',
    role: 'Механик',
    spec: 'ТО, расходники, шиномонтаж',
    photo: '/master/master3.webp',
    photoAlt: 'Андрей — механик «ПроМакс»',
  },
];

export const TRUST_FACTS: TrustFact[] = [
  {
    value: '5',
    title: 'Человек в смене',
    note: 'владелец, два мастера, электрик и приёмщик',
  },
  {
    value: '20+',
    title: 'Лет суммарного опыта',
    note: 'стаж смены: подвеска, моторы, электрика',
  },
  {
    value: '6',
    unit: 'мес.',
    title: 'Гарантия на работы',
    note: 'договор и акт на каждую машину',
  },
];
