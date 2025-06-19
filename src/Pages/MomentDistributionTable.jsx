import React, { useMemo } from "react";

const MomentDistributionTable = ({ joints, spans, supports, fixedEndMoments, distributionFactors }) => {
  const structure = useMemo(() => {
    const headers = fixedEndMoments.flatMap(({ from, to }) => [`${from}${to}`, `${to}${from}`]);
    const uniqueHeaders = [...new Set(headers)];

    const initialRow = {};
    uniqueHeaders.forEach(h => (initialRow[h] = 0));
    fixedEndMoments.forEach(({ from, to, femFromTo, femToFrom }) => {
      initialRow[`${from}${to}`] = femFromTo;
      initialRow[`${to}${from}`] = femToFrom;
    });

    const rows = [];
    rows.push({ label: "FEM", ...initialRow });

    const dfMap = {};
    distributionFactors.forEach(({ from, to, value }) => {
      const key = `${from}${to}`;
      dfMap[key] = value;
    });

    // Add distribution factor row
    const dfRow = { label: "DF" };
    uniqueHeaders.forEach(h => {
      dfRow[h] = dfMap[h] !== undefined ? dfMap[h] : null;
    });
    rows.push(dfRow);

    let currentMoments = { ...initialRow };
    const epsilon = 0.01;
    let iteration = 0;
    let maxChange = Infinity;

    while (iteration < 10 && maxChange > epsilon) {
      const balanceRow = {};
      const carryOverRow = {};
      maxChange = 0;

      joints.forEach(joint => {
        const from = joint.label;
        const connected = uniqueHeaders.filter(h => h.startsWith(from));
        const unbalancedMoment = connected.reduce((sum, h) => sum + (currentMoments[h] || 0), 0);

        connected.forEach(h => {
          const df = dfMap[h] || 0;
          const distributed = -unbalancedMoment * df;
          balanceRow[h] = distributed;
          const opposite = h[1] + h[0];
          carryOverRow[opposite] = (carryOverRow[opposite] || 0) + distributed / 2;

          maxChange = Math.max(maxChange, Math.abs(distributed));
        });
      });

      rows.push({ label: `BAL ${iteration + 1}`, ...balanceRow });
      rows.push({ label: `CO ${iteration + 1}`, ...carryOverRow });

      uniqueHeaders.forEach(h => {
        currentMoments[h] =
          (currentMoments[h] || 0) + (balanceRow[h] || 0) + (carryOverRow[h] || 0);
      });

      iteration++;
    }

    const totalRow = {};
    uniqueHeaders.forEach(h => {
      totalRow[h] = currentMoments[h];
    });
    rows.push({ label: "Total", ...totalRow });

    return { headers: uniqueHeaders, rows };
  }, [joints, fixedEndMoments, distributionFactors]);

  return (
    <div className="overflow-auto">
      <table className="min-w-full table-auto border border-gray-500 text-white">
        <thead className="bg-gray-800">
          <tr>
            <th className="border border-gray-500 p-2">Step</th>
            {structure.headers.map(header => (
              <th key={header} className="border border-gray-500 p-2">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {structure.rows.map((row, idx) => (
            <tr key={idx} className="bg-gray-700">
              <td className="border border-gray-500 p-2 font-bold">{row.label}</td>
              {structure.headers.map(h => (
                <td key={h} className="border border-gray-500 p-2 text-center">
                  {row[h] !== undefined && row[h] !== null ? row[h].toFixed(3) : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MomentDistributionTable;
