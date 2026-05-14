/**
 * Test helpers for interacting with the shared `Select` component
 * (`src/components/ui/Select.tsx`), which wraps Headless UI Listbox.
 *
 * The old `selectOptions(getByTestId(...), 'value')` pattern no longer
 * works because the Listbox renders a custom `<button>` + portal-style
 * `<ul role="listbox">` instead of a native `<select>`. The button
 * exposes the field via `aria-label`; options expose their visible
 * label via their text node.
 */
import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/**
 * Open the Listbox identified by `ariaLabel`, click the option whose
 * visible label is `optionLabel`, and wait for the menu to close.
 *
 * Throws (via Testing Library) if either the button or the option is
 * not in the DOM.
 */
export async function selectListboxOption(
  user: UserEvent,
  ariaLabel: string,
  optionLabel: string,
): Promise<void> {
  const button = screen.getByRole('button', { name: ariaLabel });
  await user.click(button);
  const option = await screen.findByRole('option', { name: optionLabel });
  await user.click(option);
}

/**
 * Returns the trimmed visible label shown on the Listbox button.
 * Useful for asserting the current selection without relying on
 * `toHaveValue` (which only works on form controls, not on Listbox
 * buttons).
 */
export function listboxButtonLabel(ariaLabel: string): string {
  const button = screen.getByRole('button', { name: ariaLabel });
  return (button.textContent ?? '').trim();
}
