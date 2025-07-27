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

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Shear Force Diagram</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={shearPoints}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" label={{ value: "Position (m)", position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: "Shear Force (kN)", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Line type="stepAfter" dataKey="shear" stroke="#f87171" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ShearForceDiagram;