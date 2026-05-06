import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface UserAvatarProps {
  profile?: Profile | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function UserAvatar({ profile, size = 'md', className }: UserAvatarProps) {
  const initial = (profile?.full_name || profile?.email || '?').charAt(0).toUpperCase();

  return (
    <Avatar className={cn(SIZES[size], className)}>
      <AvatarImage src={profile?.avatar_url || undefined} />
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
