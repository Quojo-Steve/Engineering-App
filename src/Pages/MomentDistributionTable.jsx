import React, { useMemo } from "react";

// Helper: always round down to 2 decimal places
const floor2dp = (num) => Math.floor(num * 100) / 100;

const MomentDistributionTable = ({
  joints,
  spans,
  supports,
  fixedEndMoments,
  distributionFactors,
}) => {
  const structure = useMemo(() => {
    const headers = fixedEndMoments.flatMap(({ from, to }) => [
      `${from}${to}`,
      `${to}${from}`,
    ]);
    const uniqueHeaders = [...new Set(headers)];

    const initialRow = {};
    uniqueHeaders.forEach((h) => (initialRow[h] = 0));
    fixedEndMoments.forEach(({ from, to, femFromTo, femToFrom }) => {
      initialRow[`${from}${to}`] = floor2dp(femFromTo);
      initialRow[`${to}${from}`] = floor2dp(femToFrom);
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
    uniqueHeaders.forEach((h) => {
      dfRow[h] = dfMap[h] !== undefined ? dfMap[h] : null;
    });
    rows.push(dfRow);

    let currentMoments = { ...initialRow };
    const epsilon = 0.01;
    let iteration = 0;
    let maxChange = Infinity;

    while (iteration < 15 && maxChange > epsilon) {
      const balanceRow = { label: `BAL ${iteration + 1}` };
      const carryOverRow = { label: `CO ${iteration + 1}` };

      uniqueHeaders.forEach((h) => {
        balanceRow[h] = 0;
        carryOverRow[h] = 0;
      });

      maxChange = 0;

      joints.forEach((joint) => {
        const supportType = supports[joint.Support_Number - 1];
        if (supportType === "Fixed") return;

        const from = joint.Label || joint.label;
        const connected = uniqueHeaders.filter((h) => h.startsWith(from));
        const unbalancedMoment = connected.reduce(
          (sum, h) => sum + (currentMoments[h] || 0),
          0
        );

        connected.forEach((h) => {
          const df = dfMap[h] || 0;
          let distributed = -unbalancedMoment * df;
          distributed = floor2dp(distributed);
          balanceRow[h] = distributed;

          const opposite = h[1] + h[0];
          let carry = distributed / 2;
          carry = floor2dp(carry);
          carryOverRow[opposite] = floor2dp(
            (carryOverRow[opposite] + carry)
          );

          maxChange = Math.max(maxChange, Math.abs(distributed));
        });
      });

      rows.push(balanceRow);
      rows.push(carryOverRow);

      uniqueHeaders.forEach((h) => {
        const updated =
          (currentMoments[h] || 0) + balanceRow[h] + carryOverRow[h];
        currentMoments[h] = floor2dp(updated);
      });

      iteration++;
    }

    const totalRow = {};
    uniqueHeaders.forEach((h) => {
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
            {structure.headers.map((header) => (
              <th key={header} className="border border-gray-500 p-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {structure.rows.map((row, idx) => (
            <tr key={idx} className="bg-gray-700">
              <td className="border border-gray-500 p-2 font-bold">
                {row.label}
              </td>
              {structure.headers.map((h) => (
                <td key={h} className="border border-gray-500 p-2 text-center">
                  {row[h] !== undefined && row[h] !== null
                    ? row[h].toFixed(2)
                    : "-"}
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
