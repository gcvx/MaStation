import { Card, CardContent } from '@/components/ui/card';
import { GasPump } from '@phosphor-icons/react';
import { StationStats } from '@/types/station';
import { translations } from '@/lib/translations';

interface StatsCardProps {
  stats: StationStats;
  isLoading: boolean;
}

export function StatsCard({ stats, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-2"></div>
            <div className="h-4 bg-muted rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GasPump size={24} className="text-primary" />
            <div className="text-3xl font-bold text-primary">
              {stats.totalStations.toLocaleString()}
            </div>
          </div>
          <div className="text-sm text-foreground">
            {translations.stats.gasStations}
          </div>
          {stats.lastUpdate && (
            <div className="text-xs text-muted-foreground mt-2">
              {translations.stats.lastUpdated} {new Date(stats.lastUpdate).toLocaleString('fr-FR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}