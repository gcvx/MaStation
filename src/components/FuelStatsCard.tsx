import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Drop, TrendDown, TrendUp, Equals, Calculator } from '@phosphor-icons/react';
import { GasStation } from '@/types/station';
import { FuelStatistics } from '@/components/StatisticsView';
import { translations } from '@/lib/translations';

interface FuelStatsCardProps {
  fuelStat: FuelStatistics;
  onStationHover: (station: GasStation | null) => void;
}

export function FuelStatsCard({ fuelStat, onStationHover }: FuelStatsCardProps) {
  const formatPrice = (price: number) => `${price.toFixed(3)}€`;
  const formatAddress = (station: GasStation) => {
    const parts: string[] = [];
    if (station.address) parts.push(station.address);
    if (station.postalCode && station.city) {
      parts.push(`${station.postalCode} ${station.city}`);
    } else if (station.postalCode) {
      parts.push(station.postalCode);
    } else if (station.city) {
      parts.push(station.city);
    }
    return parts.join(', ');
  };

  const StationTooltip = ({ 
    children, 
    station, 
    price 
  }: { 
    children: React.ReactNode; 
    station: GasStation; 
    price: number;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="cursor-pointer hover:bg-accent/50 rounded p-1 transition-colors"
            onMouseEnter={() => onStationHover(station)}
            onMouseLeave={() => onStationHover(null)}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 max-w-xs">
            <div className="font-semibold">{station.name || `Station ${station.id}`}</div>
            <div className="text-sm">{formatAddress(station)}</div>
            <div className="text-sm font-medium">{formatPrice(price)}</div>
            {station.brand && (
              <Badge variant="outline" className="text-xs">
                {station.brand}
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Drop size={18} className="text-primary" />
            <span>{fuelStat.fuelName}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {fuelStat.totalStations} stations
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Statistics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cheapest */}
          {fuelStat.cheapest && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendDown size={12} />
                {translations.statistics.priceStats.cheapest}
              </div>
              <StationTooltip 
                station={fuelStat.cheapest.station} 
                price={fuelStat.cheapest.price}
              >
                <div className="text-lg font-bold text-green-600">
                  {formatPrice(fuelStat.cheapest.price)}
                </div>
              </StationTooltip>
            </div>
          )}

          {/* Most Expensive */}
          {fuelStat.mostExpensive && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendUp size={12} />
                {translations.statistics.priceStats.mostExpensive}
              </div>
              <StationTooltip 
                station={fuelStat.mostExpensive.station} 
                price={fuelStat.mostExpensive.price}
              >
                <div className="text-lg font-bold text-red-600">
                  {formatPrice(fuelStat.mostExpensive.price)}
                </div>
              </StationTooltip>
            </div>
          )}

          {/* Median */}
          {fuelStat.median !== null && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Equals size={12} />
                {translations.statistics.priceStats.median}
              </div>
              <div className="text-lg font-bold text-blue-600">
                {formatPrice(fuelStat.median)}
              </div>
            </div>
          )}

          {/* Average */}
          {fuelStat.average !== null && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calculator size={12} />
                {translations.statistics.priceStats.average}
              </div>
              <div className="text-lg font-bold text-purple-600">
                {formatPrice(fuelStat.average)}
              </div>
            </div>
          )}
        </div>

        {/* Price Range Indicator */}
        {fuelStat.cheapest && fuelStat.mostExpensive && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">
              Écart de prix
            </div>
            <div className="text-sm font-medium">
              {formatPrice(fuelStat.mostExpensive.price - fuelStat.cheapest.price)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}