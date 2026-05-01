'use client';

import { TEXT_CONSTANTS } from '@/constants/text';
import type { GuardPost } from '@/types/guardSchedule';
import HeadcountWindowEditor from './HeadcountWindowEditor';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.POSTS;

interface Props {
  posts: GuardPost[];
  onChange: (next: GuardPost[]) => void;
}

function newPostId(): string {
  return `post-${Math.random().toString(36).slice(2, 9)}`;
}

export default function PostsEditor({ posts, onChange }: Props) {
  const add = () => {
    onChange([
      ...posts,
      { id: newPostId(), name: '', defaultHeadcount: 1, headcountWindows: [] },
    ]);
  };
  const remove = (id: string) => onChange(posts.filter((p) => p.id !== id));
  const update = (id: string, patch: Partial<GuardPost>) =>
    onChange(posts.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">{T.TITLE}</h2>
        <button type="button" onClick={add} className="btn-primary">{T.ADD}</button>
      </div>

      {posts.length === 0 && (
        <p className="text-sm text-neutral-600">{TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.ERRORS.NO_POSTS}</p>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="card-base p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col text-sm text-neutral-700 flex-1 min-w-[200px]">
                <span>{T.NAME_LABEL}</span>
                <input
                  type="text"
                  className="input-base mt-1"
                  value={post.name}
                  placeholder={T.NAME_PLACEHOLDER}
                  onChange={(e) => update(post.id, { name: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm text-neutral-700">
                <span>{T.DEFAULT_HEADCOUNT}</span>
                <input
                  type="number"
                  min={0}
                  className="input-base mt-1 w-24"
                  value={post.defaultHeadcount}
                  onChange={(e) =>
                    update(post.id, { defaultHeadcount: Math.max(0, Number(e.target.value)) })
                  }
                />
              </label>
              <button
                type="button"
                onClick={() => remove(post.id)}
                className="btn-ghost text-sm"
                aria-label={`${T.REMOVE}: ${post.name}`}
              >
                {T.REMOVE}
              </button>
            </div>
            <HeadcountWindowEditor
              windows={post.headcountWindows}
              onChange={(windows) => update(post.id, { headcountWindows: windows })}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
