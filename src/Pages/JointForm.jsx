import React from 'react';

const handleJointChange = (index, field, value, formData, setFormData) => {
  const updatedJoints = [...formData.joints];
  
  if (field === "label") {
    const labelExists = updatedJoints.some(
      (joint, i) => i !== index && joint.Label === value.toUpperCase()
    );
    if (labelExists) {
      alert("Joint labels must be unique.");
      return;
    }
    updatedJoints[index].Label = value.toUpperCase();

    // Automatically connect to the next joint if it exists and has a label
    if (index < updatedJoints.length - 1) {
      const currentJoint = updatedJoints[index];
      const nextJoint = updatedJoints[index + 1];
      if (nextJoint.Label && currentJoint.Label) {
        // Clear existing connections for current joint
        currentJoint.Span_To = [];
        // Connect to next joint
        currentJoint.Span_To.push(nextJoint.Label);
        // Update next joint's connections to include current joint
        nextJoint.Span_To = nextJoint.Span_To.filter(
          (conn) => conn !== currentJoint.Label
        );
        nextJoint.Span_To.push(currentJoint.Label);
      }
    }
    // Update previous joint's connection if it exists
    if (index > 0) {
      const prevJoint = updatedJoints[index - 1];
      if (prevJoint.Label && updatedJoints[index].Label) {
        prevJoint.Span_To = [updatedJoints[index].Label];
        updatedJoints[index].Span_To = updatedJoints[index].Span_To.filter(
          (conn) => conn !== prevJoint.Label
        );
        updatedJoints[index].Span_To.push(prevJoint.Label);
      }
    }
  }
  
  setFormData({ ...formData, joints: updatedJoints });
};

const JointForm = ({ formData, setFormData }) => {
  const getJointLabel = (index, totalJoints) => {
    if (index === 0) return "Start Joint";
    if (index === totalJoints - 1) return "End Joint";
    const num = index + 1;
    let suffix = "th";
    if (num === 1) suffix = "st";
    else if (num === 2) suffix = "nd";
    else if (num === 3) suffix = "rd";
    return `${num}${suffix} Joint`;
  };

  return (
    <div className="bg-gray-800 p-2 md:p-2 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-blue-500 mb-4">
        Joint Names
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-gray-300">Joint</th>
              <th className="p-3 text-gray-300">Alphabetic Label</th>
              <th className="p-3 text-gray-300">Connected To</th>
            </tr>
          </thead>
          <tbody>
            {formData.joints.map((joint, index) => (
              <tr key={index} className="border-t border-gray-600">
                <td className="p-3">
                  {getJointLabel(index, formData.joints.length)}
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={joint.Label}
                    onChange={(e) =>
                      handleJointChange(index, "label", e.target.value, formData, setFormData)
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., A"
                    maxLength="1"
                    required
                  />
                </td>
                <td className="p-3">
                  {joint.Span_To.length > 0
                    ? joint.Span_To.join(", ")
                    : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JointForm;