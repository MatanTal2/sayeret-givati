import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostsEditor from '../PostsEditor';
import type { GuardPost } from '@/types/guardSchedule';

const post = (id: string, name = 'A'): GuardPost => ({
  id,
  name,
  defaultHeadcount: 1,
  headcountWindows: [],
});

describe('PostsEditor', () => {
  it('renders posts and allows adding a new one', () => {
    const onChange = jest.fn();
    render(<PostsEditor posts={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText(/הוסף עמדה/));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0] as GuardPost[];
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe('');
  });

  it('removes a post', () => {
    const onChange = jest.fn();
    render(<PostsEditor posts={[post('p1', 'שער')]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/שער/));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('updates post name', () => {
    const onChange = jest.fn();
    render(<PostsEditor posts={[post('p1')]} onChange={onChange} />);
    const input = screen.getAllByRole('textbox')[0];
    fireEvent.change(input, { target: { value: 'שער חדש' } });
    const updated = onChange.mock.calls.at(-1)![0] as GuardPost[];
    expect(updated[0].name).toBe('שער חדש');
  });

  it('shows headcount window editor with overlap warning', () => {
    const onChange = jest.fn();
    const overlapping: GuardPost = {
      id: 'p1',
      name: 'A',
      defaultHeadcount: 1,
      headcountWindows: [
        { startHour: 0, endHour: 6, headcount: 1 },
        { startHour: 4, endHour: 8, headcount: 2 },
      ],
    };
    render(<PostsEditor posts={[overlapping]} onChange={onChange} />);
    expect(screen.getByText(/חופפות/)).toBeInTheDocument();
  });
});
