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

const ShearForceDiagram = ({ loads, total, spans }) => {
  // Calculate reactions at supports
  const calculateReactions = () => {
    const reactions = {};
    const joints = [];

    // Collect all joints
    spans.forEach((span) => {
      if (!joints.includes(span.from)) joints.push(span.from);
      if (!joints.includes(span.to)) joints.push(span.to);
    });

    // Initialize reactions
    joints.forEach((joint) => {
      reactions[joint] = 0;
    });

    // Calculate reactions using the bending moments
    spans.forEach((span) => {
      const spanLength = parseFloat(span.value) || 0;
      const load = loads.find((l) => l.from === span.from && l.to === span.to);
      
      if (!load) return;
      
      const loadValue = parseFloat(load.value) || 0;
      const loadDistance = parseFloat(load.distance) || 0;
      
      // Get bending moments at ends of span
      const M_start = parseFloat(total[`${span.from}${span.to}`]) || 0;
      const M_end = parseFloat(total[`${span.to}${span.from}`]) || 0;
      
      if (load.type === "UDL") {
        // For UDL, calculate reactions using formulas for fixed beams
        const R_start = (loadValue * spanLength / 2) + (M_start - M_end) / spanLength;
        const R_end = (loadValue * spanLength / 2) - (M_start - M_end) / spanLength;
        
        reactions[span.from] += R_start;
        reactions[span.to] += R_end;
      } else if (load.type === "Point Load") {
        // For point load, calculate reactions
        const a = loadDistance;
        const b = spanLength - loadDistance;
        
        const R_start = (loadValue * b * b * (spanLength + 2 * a)) / (spanLength * spanLength * spanLength) 
                        + (M_end - M_start) / spanLength;
        const R_end = (loadValue * a * a * (spanLength + 2 * b)) / (spanLength * spanLength * spanLength)
                      - (M_end - M_start) / spanLength;
        
        reactions[span.from] += R_start;
        reactions[span.to] += R_end;
      }
    });

    return reactions;
  };

  // Generate shear force data points for plotting
  const generateShearForceData = () => {
    const reactions = calculateReactions();
    const data = [];
    let cumulativeDistance = 0;
    let currentShear = 0;

    spans.forEach((span, spanIndex) => {
      const spanLength = parseFloat(span.value) || 0;
      const load = loads.find((l) => l.from === span.from && l.to === span.to);
      
      // At the start of each span, account for the reaction force
      if (spanIndex === 0) {
        // First span starts with reaction at A
        currentShear = reactions[span.from];
      } else {
        // For subsequent spans, we need to account for the reaction at the support
        currentShear += reactions[span.from];
      }
      
      // Add start point
      data.push({
        distance: cumulativeDistance,
        shearForce: currentShear,
        position: span.from,
      });

      if (load) {
        const loadValue = parseFloat(load.value) || 0;
        const loadDistance = parseFloat(load.distance) || 0;

        if (load.type === "UDL") {
          // For UDL, calculate shear force at multiple points
          const steps = 20;
          for (let i = 1; i <= steps; i++) {
            const x = (i / steps) * spanLength;
            const shearAtX = currentShear - loadValue * x;
            data.push({
              distance: cumulativeDistance + x,
              shearForce: shearAtX,
              position: `${span.from}-${span.to}`,
            });
            
            // Update current shear for the end of span
            if (i === steps) {
              currentShear = shearAtX;
            }
          }
        } else if (load.type === "Point Load") {
          // For point load, calculate shear force before and after the load
          
          // Before the load (if load is not at the very beginning)
          if (loadDistance > 0) {
            data.push({
              distance: cumulativeDistance + loadDistance - 0.001,
              shearForce: currentShear,
              position: `${span.from}-${span.to}`,
            });
          }

          // After the load
          currentShear -= loadValue;
          data.push({
            distance: cumulativeDistance + loadDistance,
            shearForce: currentShear,
            position: `${span.from}-${span.to}`,
          });

          // End of span
          data.push({
            distance: cumulativeDistance + spanLength,
            shearForce: currentShear,
            position: span.to,
          });
        }
      } else {
        // No load on this span, constant shear force
        data.push({
          distance: cumulativeDistance + spanLength,
          shearForce: currentShear,
          position: span.to,
        });
      }

      cumulativeDistance += spanLength;
    });

    return data;
  };

  const shearData = generateShearForceData();
  const reactions = calculateReactions();

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Shear Force Diagram
      </h2>

      {/* Display calculated reactions */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Support Reactions:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {Object.entries(reactions).map(([joint, force]) => (
            <div key={joint} className="flex justify-between">
              <span className="font-medium">Support {joint}:</span>
              <span className="text-blue-600">
                {isNaN(force) ? "0.00" : force.toFixed(2)} kN
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shear Force Diagram */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={shearData}
            margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="distance"
              type="number"
              domain={["dataMin", "dataMax"]}
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
              }}
            />
            <YAxis
              label={{
                value: "Shear Force (kN)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              formatter={(value) => [
                `${(parseFloat(value) || 0).toFixed(2)} kN`,
                "Shear Force",
              ]}
              labelFormatter={(value) => `Distance: ${value.toFixed(2)} m`}
            />
            <ReferenceLine y={0} stroke="black" strokeWidth={2} />
            <Line
              type="linear"
              dataKey="shearForce"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: "#2563eb", r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShearForceDiagram;