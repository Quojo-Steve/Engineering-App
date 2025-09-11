import React, { useMemo } from "react";
import BendingMomentDiagram from "./BendingMomentDiagram";
import MomentDistributionAndBMD from "./BendingMomentDiagram";
import ShearForceDiagram from "./ShearForceDiagram";

// Helper: always round down to 2 decimal places
const floor3dp = (num) => Math.floor(num * 100) / 100;

const MomentDistributionTable = ({
  joints,
  spans,
  loads,
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
      initialRow[`${from}${to}`] = floor3dp(femFromTo);
      initialRow[`${to}${from}`] = floor3dp(femToFrom);
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

    while (iteration < 18 && maxChange > epsilon) {
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
          distributed = floor3dp(distributed);
          balanceRow[h] = distributed;

          const opposite = h[1] + h[0];
          let carry = distributed / 2;
          carry = floor3dp(carry);
          carryOverRow[opposite] = floor3dp(
            (carryOverRow[opposite] || 0) + carry
          );

          maxChange = Math.max(maxChange, Math.abs(distributed));
        });
      });

      rows.push(balanceRow);
      rows.push(carryOverRow);

      uniqueHeaders.forEach((h) => {
        const updated =
          (currentMoments[h] || 0) + balanceRow[h] + carryOverRow[h];
        currentMoments[h] = floor3dp(updated);
      });

      iteration++;
    }

    const totalRow = { label: "Total" };
    uniqueHeaders.forEach((h) => {
      totalRow[h] = currentMoments[h] || 0;
    });
    rows.push(totalRow);
    return { headers: uniqueHeaders, rows, totalRow };
  }, [joints, fixedEndMoments, distributionFactors]);

  return (
    <div className="overflow-auto">
      <table className="min-w-full table-auto border border-gray-500 text-white mb-5">
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
                    ? row[h].toFixed(3)
                    : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ShearForceDiagram loads={loads} total={structure.totalRow} spans={spans} />
    </div>
  );
};

export default MomentDistributionTable;
