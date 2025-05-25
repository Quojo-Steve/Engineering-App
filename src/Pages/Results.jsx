import React from 'react';
import { useLocation } from 'react-router-dom';

const Results = () => {
  const { state } = useLocation();
  const { formData, numIterations } = state || {};
console.log(formData, numIterations);
  if (!formData || !numIterations) {
    return <div className="min-h-screen bg-gray-900 text-white p-6">No data available.</div>;
  }

  const { joints, stiffnessFactors, distributionFactors, fixedEndMoments } = formData;

  // Prepare members (e.g., AB, BA, BC, CB)
  const members = [];
  joints.forEach(joint => {
    joint.connections.forEach(toLabel => {
      members.push(`${joint.label}${toLabel}`); // e.g., AB
      members.push(`${toLabel}${joint.label}`); // e.g., BA
    });
  });
  const uniqueMembers = [...new Set(members)].sort();

  // Initialize moment distribution table
  const initialMoments = {};
  uniqueMembers.forEach(member => {
    const from = member[0];
    const to = member[1];
    const fem = fixedEndMoments.find(fem => fem.from === from && fem.to === to);
    initialMoments[member] = fem ? (member === `${fem.from}${fem.to}` ? fem.femFromTo : fem.femToFrom) : 0;
  });

  // Moment Distribution Method
 // Moment Distribution Method
const cycles = [];
let currentMoments = { ...initialMoments };

for (let cycle = 1; cycle <= numIterations; cycle++) {
  const cycleData = { balance: {}, co: {} };

  // Step 1: Balance at each joint
  const unbalancedMoments = {};
  joints.forEach(joint => {
    const incomingMoments = [];
    uniqueMembers.forEach(member => {
      if (member.startsWith(joint.label)) {
        incomingMoments.push(currentMoments[member]);
      }
    });
    const totalUnbalanced = incomingMoments.reduce((sum, m) => sum + m, 0);
    unbalancedMoments[joint.label] = -totalUnbalanced;
  });

  // Distribute moments at each joint
  joints.forEach(joint => {
    const from = joint.label;
    const unbalanced = unbalancedMoments[from];

    joint.connections.forEach(to => {
      const member = `${from}${to}`;
      const dfEntry = distributionFactors.find(df => df.from === from && df.to === to);
      const df = dfEntry ? dfEntry.value : 0;
      const distributedMoment = unbalanced * df;

      // Balance moment applied
      cycleData.balance[member] = distributedMoment;

      // Update current moment
      currentMoments[member] += distributedMoment;
    });
  }); 

  cycles.push(cycleData);
}


  // Calculate total moments
  const totalMoments = { ...initialMoments };
  uniqueMembers.forEach(member => {
    cycles.forEach(cycle => {
      totalMoments[member] += (cycle.balance[member] || 0) + (cycle.co[member] || 0);
    });
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold mb-6">Results</h2>
      <h3 className="text-xl font-semibold mb-4">Table 1: Moment Distribution Method</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-gray-300">Joint</th>
              {uniqueMembers.map(member => (
                <th key={member} className="p-3 text-gray-300">{member}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Stiffness Factor */}
            <tr className="border-t border-gray-600">
              <td className="p-3">Stiffness Factor</td>
              {uniqueMembers.map(member => {
                const sf = stiffnessFactors.find(sf => 
                  (sf.from === member[0] && sf.to === member[1]) || 
                  (sf.to === member[0] && sf.from === member[1])
                );
                return (
                  <td key={member} className="p-3">
                    {sf ? sf.value.toFixed(6) : "0"}
                  </td>
                );
              })}
            </tr>

            {/* Distribution Factor */}
            <tr className="border-t border-gray-600">
              <td className="p-3">Distribution Factor</td>
              {uniqueMembers.map(member => {
                const df = distributionFactors.find(df => df.from === member[0] && df.to === member[1]);
                return (
                  <td key={member} className="p-3">
                    {df ? df.value.toFixed(6) : "0"}
                  </td>
                );
              })}
            </tr>

            {/* Fixed End Moments */}
            <tr className="border-t border-gray-600">
              <td className="p-3">Fixed-end Moments</td>
              {uniqueMembers.map(member => (
                <td key={member} className="p-3">
                  {initialMoments[member].toFixed(2)}
                </td>
              ))}
            </tr>

            {/* Cycles */}
            {cycles.map((cycle, index) => (
              <React.Fragment key={index}>
                <tr className="border-t border-gray-600">
                  <td className="p-3">Cycle {index + 1} Balance</td>
                  {uniqueMembers.map(member => (
                    <td key={member} className="p-3">
                      {(cycle.balance[member] || 0).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-gray-600">
                  <td className="p-3">CO</td>
                  {uniqueMembers.map(member => (
                    <td key={member} className="p-3">
                      {(cycle.co[member] || 0).toFixed(2)}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            ))}

            {/* Total Moments */}
            <tr className="border-t border-gray-600 font-bold">
              <td className="p-3">Total Moments</td>
              {uniqueMembers.map(member => (
                <td key={member} className="p-3">
                  {totalMoments[member].toFixed(1)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Results;