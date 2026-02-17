import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function RiskHeatMap({ risks, onSegmentClick }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!risks || risks.length === 0 || !svgRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 150 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Color scale for risk scores
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateRdYlGn)
      .clamp(true);

    // Reverse the color scale so red = high risk
    const riskColorScale = (score) => {
      const reversed = 100 - score;
      return colorScale(reversed);
    };

    // Create rectangles for each segment
    const cellHeight = height / risks.length;
    const cellWidth = width;

    risks.forEach((risk, i) => {
      const y = i * cellHeight;
      const riskScore = risk.risk_score || 0;

      // Background rectangle (clickable)
      g.append("rect")
        .attr("x", 0)
        .attr("y", y)
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("fill", riskColorScale(riskScore))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("rx", 4)
        .style("cursor", "pointer")
        .on("click", () => {
          if (onSegmentClick) {
            onSegmentClick(risk);
          }
        });

      // Segment name
      g.append("text")
        .attr("x", 10)
        .attr("y", y + cellHeight / 2)
        .attr("dy", "0.35em")
        .attr("fill", riskScore > 50 ? "#fff" : "#000")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .text(risk.grid_segment);

      // Risk score
      g.append("text")
        .attr("x", cellWidth - 10)
        .attr("y", y + cellHeight / 2)
        .attr("dy", "0.35em")
        .attr("fill", riskScore > 50 ? "#fff" : "#000")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(`${riskScore}`);

      // Risk bar visualization
      const barWidth = (riskScore / 100) * (cellWidth - 200);
      g.append("rect")
        .attr("x", 150)
        .attr("y", y + cellHeight / 2 - 8)
        .attr("width", barWidth)
        .attr("height", 16)
        .attr("fill", riskScore > 70 ? "#dc2626" : riskScore > 40 ? "#f59e0b" : "#10b981")
        .attr("rx", 2);
    });

    // Legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 10;
    const legendY = height + 30;

    const legendScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => `${d}`);

    // Legend gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "riskGradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    for (let i = 0; i <= 100; i += 10) {
      gradient.append("stop")
        .attr("offset", `${i}%`)
        .attr("stop-color", riskColorScale(i));
    }

    svg.append("rect")
      .attr("x", margin.left + legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "url(#riskGradient)")
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    svg.append("g")
      .attr("transform", `translate(${margin.left + legendX},${legendY + legendHeight})`)
      .call(legendAxis)
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", 20)
      .attr("fill", "currentColor")
      .style("text-anchor", "middle")
      .text("Risk Score");

  }, [risks]);

  return (
    <div>
      <svg ref={svgRef} className="w-full" style={{ maxHeight: '450px' }}></svg>
    </div>
  );
}

export default RiskHeatMap;

