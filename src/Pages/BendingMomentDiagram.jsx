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

const BendingMomentDiagram = ({ spans, loads, finalMoments }) => {
  // Check if finalMoments is defined
  if (!finalMoments) {
    console.error("finalMoments is undefined");
    return <div>Error: Final moments not provided</div>;
  }
  // console.log(finalMoments)

  const momentPoints = [];
  let currentX = 0;

  spans.forEach((span, i) => {
    const spanLength = parseFloat(span.value);
    const load = loads.find(
      (load) => load.from === span.from && load.to === span.to
    );

    // Safely access final moments
    const M_A = finalMoments[`${span.from}${span.to}`] || 0;
    const M_B = finalMoments[`${span.to}${span.from}`] || 0;

    if (load.type === "UDL") {
      const w = parseFloat(load.value); // kN/m
      const L = spanLength;
      // Moment equation: M(x) = M_A + (w*x^2)/2 + ((M_B - M_A + (w*L^2)/2)/L)*x
      for (let x = 0; x <= L; x += 0.1) {
        const xPos = currentX + x;
        const moment =
          M_A +
          (w * x * x) / 2 +
          ((M_B - M_A + (w * L * L) / 2) / L) * x;
        momentPoints.push({ x: xPos, moment: parseFloat(moment.toFixed(2)) });
      }
    } else if (load.type === "Point Load") {
      const P = parseFloat(load.value); // kN
      const a = parseFloat(load.distance); // distance from 'from'
      const L = spanLength;
      // Compute reaction at B (simplified, assuming linear moment variation)
      const reactionB = (M_B - M_A + P * (L - a)) / L;
      for (let x = 0; x <= L; x += 0.1) {
        const xPos = currentX + x;
        let moment;
        if (x <= a) {
          moment = M_A + reactionB * x;
        } else {
          moment = M_A + reactionB * x - P * (x - a);
        }
        momentPoints.push({ x: xPos, moment: parseFloat(moment.toFixed(2)) });
      }
    }

    currentX += spanLength;
  });

  // Calculate y-axis domain
  const allMoments = momentPoints.map((point) => point.moment);
  const maxMoment = Math.max(...allMoments);
  const minMoment = Math.min(...allMoments);
  const yDomain = [
    Math.min(minMoment * 1.1, 0),
    Math.max(maxMoment * 1.1, 0),
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-white">Bending Moment Diagram</h2>
      <div style={{ padding: "20px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={momentPoints}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
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
            <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5} />
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