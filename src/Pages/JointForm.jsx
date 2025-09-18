import React from 'react';

const handleJointChange = (index, field, value, formData, setFormData) => {
  const updatedJoints = [...formData.joints];

  if (field === "label") {
    // Check for unique label
    const labelExists = updatedJoints.some(
      (joint, i) => i !== index && joint.Label === value.toUpperCase()
    );
    if (labelExists) {
      alert("Joint labels must be unique.");
      return;
    }

    // Update the current joint's label
    updatedJoints[index].Label = value.toUpperCase();

    // Clear connections for all joints to rebuild them correctly
    updatedJoints.forEach((joint) => {
      joint.Span_To = [];
    });

    // Rebuild connections for all joints to ensure linear chain
    updatedJoints.forEach((joint, i) => {
      const isStartJoint = i === 0;
      const isEndJoint = i === updatedJoints.length - 1;

      // Connect to previous joint (if not the start joint and previous joint has a label)
      if (!isStartJoint && updatedJoints[i - 1].Label) {
        joint.Span_To.push(updatedJoints[i - 1].Label);
      }

      // Connect to next joint (if not the end joint and next joint has a label)
      if (!isEndJoint && updatedJoints[i + 1].Label) {
        joint.Span_To.push(updatedJoints[i + 1].Label);
      }
    });

    setFormData({ ...formData, joints: updatedJoints });
  }
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