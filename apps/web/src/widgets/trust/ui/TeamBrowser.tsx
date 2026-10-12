'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Heading, Text } from '@/shared/ui';
import type { TeamMember } from '@/entities/master';

interface TeamBrowserProps {
  team: TeamMember[];
}

export function TeamBrowser({ team }: TeamBrowserProps) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [bar, setBar] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const syncBar = () => {
      const el = tabRefs.current[active];
      if (el) setBar({ top: el.offsetTop, height: el.offsetHeight });
    };
    syncBar();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(syncBar);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active, team]);

  if (team.length === 0) return null;

  // Команда может ужаться после монтирования — держим индекс в границах.
  const activeIndex = Math.min(active, team.length - 1);
  const current = team[activeIndex];

  if (team.length === 1) {
    const member = team[0];
    return (
      <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,340px)_1fr] sm:items-center sm:gap-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-panel">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.photoAlt ?? member.name}
              fill
              sizes="(min-width: 640px) 340px, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="flex flex-col items-center justify-center gap-2 font-mono text-content-dim">
              <span className="text-2xl">1:1</span>
              <span className="text-caption uppercase tracking-[0.1em]">фото мастера</span>
            </span>
          )}
        </div>
        <div>
          <Heading
            variant="display-sm"
            font="display"
            as="h3"
            className="text-left uppercase leading-none"
          >
            {member.name}
          </Heading>
          <span className="mt-2 block font-mono text-caption uppercase tracking-[0.08em] text-primary">
            {member.role}
          </span>
          <Text variant="body" color="muted" className="mt-3 max-w-[480px] leading-normal">
            {member.spec}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-9">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Мастера"
        aria-orientation="vertical"
        className="relative border-t border-border"
        onKeyDown={(event) => {
          let next: number | null = null;
          if (event.key === 'ArrowDown') next = (activeIndex + 1) % team.length;
          else if (event.key === 'ArrowUp') next = (activeIndex - 1 + team.length) % team.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = team.length - 1;
          if (next === null) return;
          event.preventDefault();
          setActive(next);
          tabRefs.current[next]?.focus();
        }}
      >
        {bar && (
          <span
            aria-hidden
            className="absolute left-0 top-0 z-10 h-px w-[3px] origin-top bg-primary transition-transform duration-[420ms] ease-snap motion-reduce:transition-none"
            style={{ transform: `translateY(${bar.top}px) scaleY(${bar.height})` }}
          />
        )}
        {team.map((member, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={member.name}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`team-tab-${index}`}
              aria-controls="team-window"
              tabIndex={isActive ? 0 : -1}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              className="group relative flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-b border-border py-5 pl-4 pr-4 text-left sm:gap-x-5 sm:pl-5 sm:pr-5"
            >
              <span
                className={`w-8 shrink-0 font-mono text-mono leading-none transition-colors duration-[420ms] ease-snap ${
                  isActive ? 'text-primary' : 'text-content-dim group-hover:text-content'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                className={`min-w-0 flex-1 truncate font-display text-display-sm font-bold uppercase leading-none transition-colors duration-[420ms] ease-snap ${
                  isActive ? 'text-content' : 'text-content-muted group-hover:text-content'
                }`}
              >
                {member.name}
              </span>
              <span
                className={`w-full text-left font-mono text-mono uppercase leading-none tracking-[0.08em] transition-colors duration-300 lg:w-auto lg:shrink-0 lg:-mr-[0.08em] lg:text-right ${
                  isActive ? 'text-primary' : 'text-content-dim group-hover:text-content'
                }`}
              >
                {member.role}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="team-window"
        aria-labelledby={`team-tab-${activeIndex}`}
        className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-panel lg:aspect-auto lg:min-h-[420px]"
      >
        {team.map(
          (member, index) =>
            member.photo && (
              <Image
                key={member.name}
                src={member.photo}
                alt={member.photoAlt ?? member.name}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className={`object-cover transition-[opacity,scale] duration-500 motion-reduce:transition-none ${
                  index === active ? 'scale-[1.03] opacity-100' : 'scale-100 opacity-0'
                }`}
              />
            ),
        )}
        {!current.photo && (
          <span className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 font-mono text-content-dim">
            <span className="text-2xl">1:1</span>
            <span className="text-caption uppercase tracking-[0.1em]">фото мастера</span>
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg/90 to-transparent p-5 pt-12">
          <span className="block font-mono text-caption uppercase tracking-[0.08em] text-primary">
            {current.role}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-content">{current.spec}</span>
        </div>
      </div>
    </div>
  );
}
