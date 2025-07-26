import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
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

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Bending Moment Diagram</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={momentPoints}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" label={{ value: "Position (m)", position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: "Moment (kNm)", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Line type="monotone" dataKey="moment" stroke="#60a5fa" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BendingMomentDiagram;
