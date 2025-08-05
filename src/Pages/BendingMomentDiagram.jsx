import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const BendingMomentDiagram = ({ spans, loads, fixedEndMoments }) => {
  const momentPoints = [];
  let currentX = 0;

  spans.forEach((span, i) => {
    const spanLength = parseFloat(span.value);
    const load = loads.find(
      (load) => load.from === span.from && load.to === span.to
    );
    const fem = fixedEndMoments.find(
      (fem) => fem.from === span.from && fem.to === span.to
    );

    const M_A = fem?.femFromTo || 0;
    const M_B = fem?.femToFrom || 0;

    for (let x = 0; x <= 1; x += 0.1) {
      const xPos = currentX + x * spanLength;
      const moment = (1 - x) * M_A + x * M_B; // linear interpolation
      momentPoints.push({ x: xPos, moment });
    }

    currentX += spanLength;
  });

  // Calculate y-axis domain to ensure zero is centered if there are both positive and negative values
  const allMoments = momentPoints.map(point => point.moment);
  const maxMoment = Math.max(...allMoments);
  const minMoment = Math.min(...allMoments);
  const yDomain = [
    Math.min(minMoment * 1.1, 0), // Extend 10% below minimum or to zero
    Math.max(maxMoment * 1.1, 0)   // Extend 10% above maximum or to zero
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Bending Moment Diagram</h2>
      <div style={{ padding: '20px' }}> {/* Added padding around the chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={momentPoints}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }} // Added margins to shift chart inward
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              label={{ value: "Position (m)", position: "insideBottom", offset: -5 }} 
            />
            <YAxis 
              domain={yDomain}
              label={{ value: "Moment (kNm)", angle: -90, position: "insideLeft" }} 
            />
            <Tooltip 
              formatter={(value) => [`${value} kNm`, "Moment"]}
              labelFormatter={(label) => `Position: ${label} m`}
            />
            {/* X-axis reference line at y=0 */}
            <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5}  />
            <Line 
              type="monotone" 
              dataKey="moment" 
              stroke="#60a5fa" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BendingMomentDiagram;