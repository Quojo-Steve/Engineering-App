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
  const supportReactions = [20, 26, 0]; // Dummy values

  const to2dp = (num) => parseFloat(num.toFixed(2));

  const shearPoints = [];
  let currentX = 0;
  let currentShear = supportReactions[0];
  shearPoints.push({ x: to2dp(currentX), shear: to2dp(currentShear) });

  spans.forEach((span, i) => {
    const spanLength = parseFloat(span.value);
    const spanLoads = loads.filter(
      (load) => load.from === span.from && load.to === span.to
    );

    spanLoads.forEach((load) => {
      if (load.type === "UDL") {
        const udlValue = parseFloat(load.value); // kN/m
        const startX = currentX + parseFloat(load.distance || 0);
        const endX = currentX + spanLength; // full-span UDL (adjust if needed)

        shearPoints.push({ x: to2dp(startX), shear: to2dp(currentShear) });

        const shearChange = udlValue * (endX - startX);
        currentShear -= shearChange;
        shearPoints.push({ x: to2dp(endX), shear: to2dp(currentShear) });
      } else if (load.type === "Point Load") {
        const loadPos = currentX + parseFloat(load.distance);
        shearPoints.push({ x: to2dp(loadPos), shear: to2dp(currentShear) });
        currentShear -= parseFloat(load.value);
        shearPoints.push({ x: to2dp(loadPos), shear: to2dp(currentShear) });
      }
    });

    currentX += spanLength;
    shearPoints.push({ x: to2dp(currentX), shear: to2dp(currentShear) });

    currentShear += supportReactions[i + 1] || 0;
    shearPoints.push({ x: to2dp(currentX), shear: to2dp(currentShear) });
  });

  const allShear = shearPoints.map((p) => p.shear);
  const maxShear = Math.max(...allShear);
  const minShear = Math.min(...allShear);
  const yDomain = [Math.min(minShear * 1.2, 0), Math.max(maxShear * 1.2, 0)];

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Shear Force Diagram
      </h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={shearPoints}
            margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="x"
              label={{
                value: "Position (m)",
                position: "insideBottom",
                offset: -10,
              }}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <YAxis
              domain={yDomain}
              label={{
                value: "Shear Force (kN)",
                angle: -90,
                position: "insideLeft",
              }}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              formatter={(value) => [`${value.toFixed(2)} kN`, "Shear Force"]}
              labelFormatter={(label) => `Position: ${label.toFixed(2)} m`}
            />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <Line
              type="linear"
              dataKey="shear"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShearForceDiagram;
