import clsx from 'clsx';

type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className }: SkeletonProps) => (
  <div aria-hidden="true" className={clsx('skeleton', className)} />
);
