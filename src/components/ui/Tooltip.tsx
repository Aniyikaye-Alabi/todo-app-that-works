import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactElement } from 'react';

interface TooltipProps {
  content: string;
  children: ReactElement;
}

/** Wrap the app once in `<TooltipProvider>` (see App.tsx). */
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <RadixTooltip.Provider delayDuration={300}>{children}</RadixTooltip.Provider>
);

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="tooltip" sideOffset={6}>
          {`// ${content}`}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
