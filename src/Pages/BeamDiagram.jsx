import React from "react";

const BeamDiagram = ({ joints, spans, supports, loads, fixedEndMoments }) => {
  const totalLength = spans.reduce((sum, span) => sum + parseFloat(span.value || 0), 0);
  const svgWidth = 800;
  const svgHeight = 250; // Increased height to accommodate annotations
  const beamY = 100;
  const scale = totalLength > 0 ? svgWidth / totalLength : 1;

  const getJointX = (label) => {
    let x = 0;
    for (const span of spans) {
      if (span.to === label) break;
      x += parseFloat(span.value || 0) * scale;
    }
    return x;
  };

  const getSupportSymbol = (type, x) => {
    switch (type) {
      case "Fixed":
        return (
          <g>
            <rect x={x - 10} y={beamY + 5} width="20" height="25" fill="none" stroke="black" strokeWidth="2" />
            <line x1={x - 10} y1={beamY + 30} x2={x + 10} y2={beamY + 30} stroke="black" strokeWidth="2" />
            <line x1={x - 8} y1={beamY + 5} x2={x - 8} y2={beamY + 30} stroke="black" strokeWidth="1" />
            <line x1={x + 8} y1={beamY + 5} x2={x + 8} y2={beamY + 30} stroke="black" strokeWidth="1" />
          </g>
        );
      case "Pin":
        return (
          <g>
            <polygon points={`${x - 10},${beamY + 30} ${x + 10},${beamY + 30} ${x},${beamY + 15}`} fill="none" stroke="black" strokeWidth="2" />
            <circle cx={x} cy={beamY + 30} r="3" fill="black" />
          </g>
        );
      case "Roller":
        return (
          <g>
            <circle cx={x - 5} cy={beamY + 25} r="3" fill="black" />
            <circle cx={x + 5} cy={beamY + 25} r="3" fill="black" />
            <line x1={x - 10} y1={beamY + 28} x2={x + 10} y2={beamY + 28} stroke="black" strokeWidth="2" />
            <line x1={x} y1={beamY + 5} x2={x} y2={beamY + 22} stroke="black" strokeWidth="2" />
          </g>
        );
      default:
        return null;
    }
  };

  const getLoadSymbol = (load, spanStartX) => {
    const span = spans.find((s) => s.from === load.from && s.to === load.to);
    const spanLength = parseFloat(span?.value || 0) * scale;

    if (load.type === "Distributed") {
      const numArrows = Math.floor(spanLength / 20); // Arrows every 20 pixels
      const arrows = [];
      for (let i = 0; i <= numArrows; i++) {
        const x = spanStartX + (i / numArrows) * spanLength;
        arrows.push(
          <line
            key={`dist-arrow-${i}`}
            x1={x}
            y1={beamY - 30}
            x2={x}
            y2={beamY}
            stroke="red"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        );
      }
      return (
        <g>
          {arrows}
          <text
            x={spanStartX + spanLength / 2}
            y={beamY - 35}
            textAnchor="middle"
            fontSize="12"
            fill="red"
          >
            {load.value} kN/m
          </text>
        </g>
      );
    } else {
      const loadX = spanStartX + parseFloat(load.distance || 0) * scale;
      return (
        <g>
          <line
            x1={loadX}
            y1={beamY - 30}
            x2={loadX}
            y2={beamY}
            stroke="red"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <text
            x={loadX}
            y={beamY - 35}
            textAnchor="middle"
            fontSize="12"
            fill="red"
          >
            {load.value} kN
          </text>
        </g>
      );
    }
  };

  const getMomentSymbol = (fem) => {
    const x1 = getJointX(fem.from);
    const x2 = getJointX(fem.to);
    const midX = (x1 + x2) / 2;
    const radius = 15;
    const direction = fem.femFromTo < 0 ? 1 : -1; // Clockwise or counterclockwise
    const startAngle = direction === 1 ? 0 : 180;
    const endAngle = direction === 1 ? 180 : 0;
    const path = `M${midX + radius * Math.cos((startAngle * Math.PI) / 180)},${beamY + 40 + radius * Math.sin((startAngle * Math.PI) / 180)} A${radius},${radius} 0 0 ${direction === 1 ? 1 : 0} ${midX + radius * Math.cos((endAngle * Math.PI) / 180)},${beamY + 40 + radius * Math.sin((endAngle * Math.PI) / 180)}`;
    
    return (
      <g>
        <path
          d={path}
          fill="none"
          stroke="purple"
          strokeWidth="2"
          markerEnd="url(#moment-arrowhead)"
        />
        <text
          x={midX}
          y={beamY + 60}
          textAnchor="middle"
          fontSize="12"
          fill="purple"
        >
          {Math.abs(fem.femFromTo)} kNm
        </text>
      </g>
    );
  };

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}
    >
      {/* Grid background */}
      <g>
        {Array.from({ length: Math.ceil(totalLength / 1) }, (_, i) => (
          <line
            key={`grid-${i}`}
            x1={i * scale}
            y1="0"
            x2={i * scale}
            y2={svgHeight}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
      </g>

      {/* Beam line */}
      <line
        x1="0"
        y1={beamY}
        x2={svgWidth}
        y2={beamY}
        stroke="#1f2937"
        strokeWidth="6"
      />

      {/* Joints and Supports */}
      {joints.map((joint, i) => {
        const x = getJointX(joint.label);
        const supportType = supports[i];
        return (
          <g key={joint.label}>
            {/* Joint marker */}
            <circle cx={x} cy={beamY} r="4" fill="#3b82f6" />
            {/* Joint label */}
            <text
              x={x}
              y={beamY - 15}
              textAnchor="middle"
              fontSize="14"
              fill="#3b82f6"
              fontWeight="bold"
            >
              {joint.label}
            </text>
            {/* Support */}
            {getSupportSymbol(supportType, x)}
          </g>
        );
      })}

      {/* Spans with length labels */}
      {spans.map((span, i) => {
        const x1 = getJointX(span.from);
        const x2 = getJointX(span.to);
        return (
          <g key={`span-${i}`}>
            <text
              x={(x1 + x2) / 2}
              y={beamY + 40}
              textAnchor="middle"
              fontSize="12"
              fill="#4b5563"
            >
              {span.value} m
            </text>
            <line
              x1={x1}
              y1={beamY + 25}
              x2={x1}
              y2={beamY + 35}
              stroke="#4b5563"
              strokeWidth="1"
            />
            <line
              x1={x2}
              y1={beamY + 25}
              x2={x2}
              y2={beamY + 35}
              stroke="#4b5563"
              strokeWidth="1"
            />
            <line
              x1={x1}
              y1={beamY + 30}
              x2={x2}
              y2={beamY + 30}
              stroke="#4b5563"
              strokeWidth="1"
              markerStart="url(#span-arrowhead)"
              markerEnd="url(#span-arrowhead)"
            />
          </g>
        );
      })}

      {/* Loads */}
      {loads.map((load, i) => (
        <g key={`load-${i}`}>
          {getLoadSymbol(load, getJointX(load.from))}
        </g>
      ))}

      {/* Fixed End Moments */}
      {fixedEndMoments.map((fem, i) => (
        <g key={`fem-${i}`}>
          {getMomentSymbol(fem)}
        </g>
      ))}

      {/* Markers */}
      <defs>
        {/* Load arrowhead */}
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 8 4, 0 8" fill="red" />
        </marker>
        {/* Moment arrowhead */}
        <marker
          id="moment-arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="purple" />
        </marker>
        {/* Span arrowhead */}
        <marker
          id="span-arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="#4b5563" />
        </marker>
      </defs>
    </svg>
  );
};

export default BeamDiagram;