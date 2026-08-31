import { useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface AvatarProps {
  initials: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZES: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 lg:w-7 lg:h-7 text-[9px] lg:text-[10px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-[10px]',
  lg: 'w-9 h-9 lg:w-12 lg:h-12 text-xs lg:text-sm',
};

export function Avatar({
  initials,
  src,
  size = 'md',
  className = '',
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={`rounded-full bg-darkGreen flex items-center justify-center text-white font-bold shrink-0 overflow-hidden ${SIZES[size]} ${className}`}
    >
      {src && !imgFailed ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
