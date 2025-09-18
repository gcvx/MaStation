import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as d3 from 'd3';
import { GasStation } from '@/types/station';
import { FuelStatistics } from '@/components/StatisticsView';
import { translations } from '@/lib/translations';

interface PriceDistributionChartProps {
  fuelStat: FuelStatistics;
  onStationHover: (station: GasStation | null) => void;
  hoveredStation: GasStation | null;
}

export function PriceDistributionChart({ 
  fuelStat, 
  onStationHover, 
  hoveredStation 
}: PriceDistributionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    price: number;
    count: number;
    stations: GasStation[];
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !fuelStat.priceDistribution.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    // Chart dimensions and margins
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xExtent = d3.extent(fuelStat.priceDistribution, d => d.price) as [number, number];
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(fuelStat.priceDistribution, d => d.count) || 0])
      .range([height, 0]);

    // Create bars
    const bars = g.selectAll(".bar")
      .data(fuelStat.priceDistribution)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.price) - 1)
      .attr("y", d => yScale(d.count))
      .attr("width", 2)
      .attr("height", d => height - yScale(d.count))
      .attr("fill", "#3b82f6")
      .attr("stroke", "#1e40af")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "#1d4ed8");
        
        const [mouseX, mouseY] = d3.pointer(event, svgRef.current);
        setTooltipData({
          x: mouseX,
          y: mouseY,
          price: d.price,
          count: d.count,
          stations: d.stations
        });
        
        // Highlight first station in the price bucket
        if (d.stations.length > 0) {
          onStationHover(d.stations[0]);
        }
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", "#3b82f6");
        setTooltipData(null);
        onStationHover(null);
      });

    // Add median line
    if (fuelStat.median !== null) {
      g.append("line")
        .attr("x1", xScale(fuelStat.median))
        .attr("x2", xScale(fuelStat.median))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#dc2626")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .style("pointer-events", "none");

      // Median label
      g.append("text")
        .attr("x", xScale(fuelStat.median))
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("fill", "#dc2626")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`Médiane: ${fuelStat.median.toFixed(3)}€`);
    }

    // Add average line
    if (fuelStat.average !== null) {
      g.append("line")
        .attr("x1", xScale(fuelStat.average))
        .attr("x2", xScale(fuelStat.average))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#7c3aed")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3,3")
        .style("pointer-events", "none");

      // Average label
      g.append("text")
        .attr("x", xScale(fuelStat.average))
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .attr("fill", "#7c3aed")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`Moyenne: ${fuelStat.average.toFixed(3)}€`);
    }

    // Add X axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${Number(d).toFixed(3)}€`)
      .ticks(8);
    
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "11px");

    // Add Y axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(6);
    
    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "11px");

    // Add axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#6b7280")
      .text(translations.statistics.charts.yAxisLabel);

    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#6b7280")
      .text(translations.statistics.charts.xAxisLabel);

  }, [fuelStat, onStationHover]);

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

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>{fuelStat.fuelName}</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {fuelStat.totalStations} stations
            </Badge>
            {fuelStat.priceDistribution.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {fuelStat.priceDistribution.length} prix différents
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg ref={svgRef} className="w-full h-auto"></svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-600" style={{ borderStyle: 'dashed' }}></div>
            <span>{translations.statistics.charts.medianLine}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-purple-600" style={{ borderStyle: 'dashed' }}></div>
            <span>{translations.statistics.charts.averageLine}</span>
          </div>
        </div>

        {/* Tooltip */}
        {tooltipData && (
          <div
            className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 max-w-xs"
            style={{
              left: tooltipData.x + 10,
              top: tooltipData.y - 10,
              transform: tooltipData.x > 250 ? 'translateX(-100%)' : 'none'
            }}
          >
            <div className="space-y-2">
              <div className="font-semibold">
                Prix: {tooltipData.price.toFixed(3)}€
              </div>
              <div className="text-sm text-muted-foreground">
                {tooltipData.count} station{tooltipData.count > 1 ? 's' : ''}
              </div>
              {tooltipData.stations.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Exemple de station:
                  </div>
                  <div className="text-xs">
                    <div className="font-medium">
                      {tooltipData.stations[0].name || `Station ${tooltipData.stations[0].id}`}
                    </div>
                    <div className="text-muted-foreground">
                      {formatAddress(tooltipData.stations[0])}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}