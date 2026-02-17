import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function LoadChart({ forecast, selectedSegment, onSegmentSelect }) {
  const svgRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    if (!forecast || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get forecast data for selected segment or aggregate
    let forecastData = [];
    if (selectedSegment && forecast.forecasts_by_segment?.[selectedSegment]) {
      forecastData = forecast.forecasts_by_segment[selectedSegment];
    } else if (forecast.forecasts_by_segment) {
      // Aggregate all segments
      const segments = Object.keys(forecast.forecasts_by_segment);
      const firstSegment = forecast.forecasts_by_segment[segments[0]];
      if (firstSegment) {
        forecastData = firstSegment.map((_, i) => {
          const total = segments.reduce((sum, seg) => {
            const segForecast = forecast.forecasts_by_segment[seg][i];
            return sum + (segForecast?.predicted_load_mw || 0);
          }, 0);
          return {
            timestamp: firstSegment[i].timestamp,
            predicted_load_mw: total,
            confidence_lower: total * 0.9,
            confidence_upper: total * 1.1,
          };
        });
      }
    } else if (forecast.forecasts) {
      forecastData = forecast.forecasts;
    }

    if (forecastData.length === 0) return;

    // Parse timestamps
    const parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");
    forecastData.forEach(d => {
      d.date = new Date(d.timestamp);
    });

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(forecastData, d => d.date))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(forecastData, d => d.confidence_lower || d.predicted_load_mw * 0.9) * 0.9,
        d3.max(forecastData, d => d.confidence_upper || d.predicted_load_mw * 1.1) * 1.1
      ])
      .nice()
      .range([height, 0]);

    // Confidence interval area
    const area = d3.area()
      .x(d => xScale(d.date))
      .y0(d => yScale(d.confidence_lower || d.predicted_load_mw * 0.9))
      .y1(d => yScale(d.confidence_upper || d.predicted_load_mw * 1.1))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(forecastData)
      .attr("fill", "#3b82f6")
      .attr("fill-opacity", 0.2)
      .attr("d", area);

    // Forecast line
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.predicted_load_mw))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(forecastData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Data points
    g.selectAll(".dot")
      .data(forecastData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.predicted_load_mw))
      .attr("r", 3)
      .attr("fill", "#3b82f6");

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d3.timeFormat("%H:%M"));

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d} MW`);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .append("text")
      .attr("x", width / 2)
      .attr("y", 35)
      .attr("fill", "currentColor")
      .style("text-anchor", "middle")
      .text("Time (Hours)");

    g.append("g")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("fill", "currentColor")
      .style("text-anchor", "middle")
      .text("Load (MW)");

  }, [forecast, selectedSegment]);

  return (
    <div>
      <div className="mb-4">
        <select
          value={selectedSegment || ""}
          onChange={(e) => onSegmentSelect(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Segments (Aggregate)</option>
          {forecast?.forecasts_by_segment && Object.keys(forecast.forecasts_by_segment).map(seg => (
            <option key={seg} value={seg}>{seg}</option>
          ))}
        </select>
      </div>
      <svg ref={svgRef} className="w-full" style={{ maxHeight: '350px' }}></svg>
    </div>
  );
}

export default LoadChart;

