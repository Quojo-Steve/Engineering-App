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

const ShearForceDiagram = ({ spans, loads, supports }) => {
  // Dummy reaction values (replace with real static analysis logic)
  const supportReactions = [20, 26, 0];

  const shearPoints = [];
  let currentX = 0;
  let currentShear = supportReactions[0];
  shearPoints.push({ x: currentX, shear: currentShear });

  spans.forEach((span, i) => {
    const spanLength = parseFloat(span.value);
    const spanLoads = loads.filter(
      (load) => load.from === span.from && load.to === span.to
    );

    spanLoads.forEach((load) => {
      const loadPos = currentX + parseFloat(load.distance);
      shearPoints.push({ x: loadPos, shear: currentShear });
      currentShear -= parseFloat(load.value);
      shearPoints.push({ x: loadPos, shear: currentShear });
    });

    currentX += spanLength;
    shearPoints.push({ x: currentX, shear: currentShear });
    currentShear += supportReactions[i + 1] || 0;
    shearPoints.push({ x: currentX, shear: currentShear });
  });

  // Calculate y-axis domain to ensure zero is centered if there are both positive and negative values
  const allShear = shearPoints.map(point => point.shear);
  const maxShear = Math.max(...allShear);
  const minShear = Math.min(...allShear);
  const yDomain = [
    Math.min(minShear * 1.2, 0), // 20% padding below minimum or to zero
    Math.max(maxShear * 1.2, 0)   // 20% padding above maximum or to zero
  ];

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Shear Force Diagram</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={shearPoints}
            margin={{
              top: 20,
              right: 30,
              left: 30,
              bottom: 30,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="x" 
              label={{ 
                value: "Position (m)", 
                position: "insideBottom", 
                offset: -10,
                fill: "#6b7280",
                fontSize: 12
              }}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickMargin={10}
            />
            <YAxis 
              domain={yDomain}
              label={{ 
                value: "Shear Force (kN)", 
                angle: -90, 
                position: "insideLeft", 
                fill: "#6b7280",
                fontSize: 12,
                offset: 15
              }}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickMargin={10}
            />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(2)} kN`, "Shear Force"]}
              labelFormatter={(label) => `Position: ${label.toFixed(2)} m`}
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: "12px"
              }}
            />
            <ReferenceLine 
              y={0} 
              stroke="#9ca3af" 
              strokeWidth={1.5} 
              strokeDasharray="3 3"
            />
            <Line 
              type="stepAfter" 
              dataKey="shear" 
              stroke="#ef4444" 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ 
                r: 7,
                stroke: "#b91c1c",
                strokeWidth: 2,
                fill: "#ffffff"
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShearForceDiagram;