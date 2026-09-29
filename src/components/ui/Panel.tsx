import type { HTMLAttributes, ReactNode } from 'react';

interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Extra content rendered on the right of the top edge (e.g. a hex tag). */
  meta?: ReactNode;
  cut?: boolean;
  as?: 'section' | 'article' | 'div';
}

export function Panel({
  title,
  meta,
  cut,
  as: Tag = 'section',
  className = '',
  children,
  ...rest
}: PanelProps) {
  return (
    <Tag className={`panel${cut ? ' panel--cut' : ''} ${className}`.trim()} {...rest}>
      {title && <h3 className="panel__title">{title}</h3>}
      {meta && (
        <span className="panel__meta" aria-hidden="true">
          {meta}
        </span>
      )}
      {children}
    </Tag>
  );
}
