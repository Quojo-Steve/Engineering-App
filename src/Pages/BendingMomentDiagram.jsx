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

const BendingMomentDiagram = ({ forces, spans, loads }) => {
  const calculateBendingMoments = () => {
    const moments = [];
    const jointNames = Object.keys(forces);
    
    // A is always 0
    moments.push({
      joint: jointNames[0],
      moment: 0,
      position: 0
    });

    let cumulativeDistance = 0;

    // Calculate for middle joints (B, C, etc.)
    for (let i = 1; i < jointNames.length; i++) {
      const currentJoint = jointNames[i];
      const previousJoint = jointNames[i - 1];
      const currentSpan = spans[i - 1];
      const spanLength = parseFloat(currentSpan.value);
      
      cumulativeDistance += spanLength;
      
      let moment = 0;

      // Calculate contribution from all previous forces and loads
      let tempDistance = 0;
      
      for (let j = 0; j < i; j++) {
        const span = spans[j];
        const load = loads[j];
        const force = forces[jointNames[j]];
        const spanLen = parseFloat(span.value);
        
        // Distance from current joint to the force
        const distanceToForce = cumulativeDistance - tempDistance;
        
        // Add force contribution
        moment += force * distanceToForce;
        
        // Subtract load contribution
        if (load.type === "UDL") {
          const udlValue = parseFloat(load.value);
          // UDL acts at the center of the span
          const distanceToUDLCenter = distanceToForce - (spanLen / 2);
          moment -= udlValue * spanLen * distanceToUDLCenter;
        } else if (load.type === "Point Load") {
          const plValue = parseFloat(load.value);
          const loadDistance = parseFloat(load.distance);
          const distanceToLoad = distanceToForce - (spanLen - loadDistance);
          if (distanceToLoad > 0) {
            moment -= plValue * distanceToLoad;
          }
        }
        
        tempDistance += spanLen;
      }

      moments.push({
        joint: currentJoint,
        moment: parseFloat(moment.toFixed(2)),
        position: cumulativeDistance
      });
    }

    return moments;
  };

  // Calculate detailed points for smooth curve
  const calculateDetailedMoments = () => {
    const detailedPoints = [];
    const jointMoments = calculateBendingMoments();
    let cumulativeDistance = 0;
    
    // Add starting point
    detailedPoints.push({ position: 0, moment: 0, label: "A" });

    for (let spanIndex = 0; spanIndex < spans.length; spanIndex++) {
      const span = spans[spanIndex];
      const load = loads[spanIndex];
      const spanLength = parseFloat(span.value);
      
      // Calculate moments at multiple points along this span
      const numPoints = 20; // Number of calculation points per span
      
      for (let k = 1; k <= numPoints; k++) {
        const x = (k / numPoints) * spanLength; // Position within current span
        const absolutePosition = cumulativeDistance + x;
        
        let moment = 0;
        
        // Calculate moment at this position
        let tempDistance = 0;
        
        for (let j = 0; j <= spanIndex; j++) {
          const currentSpan = spans[j];
          const currentLoad = loads[j];
          const force = forces[Object.keys(forces)[j]];
          const currentSpanLength = parseFloat(currentSpan.value);
          
          if (j < spanIndex) {
            // Complete previous spans
            const distanceToForce = absolutePosition - tempDistance;
            moment += force * distanceToForce;
            
            if (currentLoad.type === "UDL") {
              const udlValue = parseFloat(currentLoad.value);
              const distanceToUDLCenter = distanceToForce - (currentSpanLength / 2);
              moment -= udlValue * currentSpanLength * distanceToUDLCenter;
            } else if (currentLoad.type === "Point Load") {
              const plValue = parseFloat(currentLoad.value);
              const loadDistance = parseFloat(currentLoad.distance);
              const distanceToLoad = distanceToForce - (currentSpanLength - loadDistance);
              if (distanceToLoad > 0) {
                moment -= plValue * distanceToLoad;
              }
            }
            
            tempDistance += currentSpanLength;
          } else if (j === spanIndex) {
            // Current span - partial calculation
            const distanceToForce = absolutePosition - tempDistance;
            moment += force * distanceToForce;
            
            if (currentLoad.type === "UDL") {
              const udlValue = parseFloat(currentLoad.value);
              // Only consider the UDL up to point x
              if (x > 0) {
                moment -= udlValue * x * (x / 2);
              }
            } else if (currentLoad.type === "Point Load") {
              const plValue = parseFloat(currentLoad.value);
              const loadDistance = parseFloat(currentLoad.distance);
              if (x > loadDistance) {
                moment -= plValue * (x - loadDistance);
              }
            }
          }
        }
        
        detailedPoints.push({
          position: parseFloat(absolutePosition.toFixed(2)),
          moment: parseFloat(moment.toFixed(2))
        });
      }
      
      cumulativeDistance += spanLength;
    }

    return detailedPoints;
  };

  const moments = calculateBendingMoments();
  const detailedPoints = calculateDetailedMoments();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-2 rounded shadow-lg border border-gray-600">
          <p className="text-white">{`Position: ${label} m`}</p>
          <p className="text-blue-300">{`Moment: ${payload[0].value} kNm`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-black">Bending Moment Diagram</h2>
      
      {/* Display calculated moments at joints */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-black mb-2">Moments at Joints:</h3>
        <div className="flex gap-4 text-black">
          {moments.map((moment, index) => (
            <div key={index} className="bg-gray-300 p-2 rounded">
              <strong>{moment.joint}:</strong> {moment.moment} kNm
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px", backgroundColor: "#fff" }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={detailedPoints}
            margin={{
              top: 20,
              right: 30,
              left: 40,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="position" 
              stroke="#333"
              label={{ value: 'Distance (m)', position: 'insideBottom', offset: -10, style: { fill: '#333' } }}
            />
            <YAxis 
              stroke="#333"
              reversed={true}
              label={{ value: 'Bending Moment (kNm)', angle: -90, position: 'insideLeft', style: { fill: '#333' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="moment"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              connectNulls={false}
            />
            {/* Add dots at joint locations */}
            {moments.map((moment, index) => (
              <ReferenceLine
                key={index}
                x={moment.position}
                stroke="#333"
                strokeDasharray="5 5"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm text-white">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span>Bending Moment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500"></div>
          <span>Zero Line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-yellow-500 border-dashed border border-yellow-500"></div>
          <span>Joint Locations</span>
        </div>
      </div>
    </div>
  );
};

export default BendingMomentDiagram;