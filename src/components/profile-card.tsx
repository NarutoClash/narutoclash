import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { villageImages } from '@/lib/village-images';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    avatar_url?: string;
    level: number;
    village?: string;
    rank?: string; // ✅ ADICIONADO
    experience?: number;
    max_experience?: number;
    ryo?: number;
  };
  className?: string;
  showExperience?: boolean;
  showRyo?: boolean;
}

export function ProfileCard({ 
  profile, 
  className,
  showExperience = true,
  showRyo = false 
}: ProfileCardProps) {
  const villageImage = profile.village ? villageImages[profile.village] : null;
  const xpPercentage = profile.max_experience 
    ? ((profile.experience || 0) / profile.max_experience) * 100 
    : 0;

  // ✅ Cores dos ranks
  const rankColors: Record<string, string> = {
    'Kage': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    'Jōnin': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    'Chūnin': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    'Genin': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    'Academia': 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
  };

  return (
    <Link href={`/profile/${profile.id}`}>
      <Card className={cn(
        "hover:bg-muted/50 transition-all cursor-pointer hover:shadow-lg",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 rounded-md border-2 border-primary">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
            </Avatar>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg truncate">{profile.name}</h3>
                {villageImage && (
                  <Image 
                    src={villageImage.imageUrl} 
                    alt={villageImage.description}
                    width={24}
                    height={24}
                    className="rounded flex-shrink-0"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                <Badge variant="default" className="text-xs">
                  Nv. {profile.level}
                </Badge>
                {profile.village && (
                  <Badge variant="outline" className="text-xs">
                    {profile.village}
                  </Badge>
                )}
                {/* ✅ BADGE DE RANK COM COR */}
                {profile.rank && (
                  <Badge 
                    className={cn(
                      "text-xs font-bold",
                      rankColors[profile.rank] || "bg-secondary"
                    )}
                  >
                    {profile.rank}
                  </Badge>
                )}
              </div>

              {showExperience && (
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">XP</span>
                    <span className="text-muted-foreground">
                      {profile.experience || 0} / {profile.max_experience || 0}
                    </span>
                  </div>
                  <Progress value={xpPercentage} className="h-1.5" />
                </div>
              )}

              {showRyo && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Ryo:</span>
                  <span className="text-sm font-bold text-amber-500">
                    {(profile.ryo || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
