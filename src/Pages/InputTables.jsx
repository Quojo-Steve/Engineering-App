import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import fixImg from '../assets/fix.png';
import rollerImg from '../assets/roller.png';
import pinImg from '../assets/pinned.png';

const InputTables = () => {
  const { state } = useLocation();
  const { numJoints, numIterations } = state || {};
  const navigate = useNavigate();

  // State for current step and form data
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    joints: Array.from({ length: numJoints }, (_, i) => ({
      jointNumber: i + 1,
      label: "",
      connections: [],
    })),
    supports: Array.from({ length: numJoints }, () => "Fixed"),
    momentsOfInertia: [], // Will be populated based on connections
    spans: [], // Will be populated based on connections
  });

  // Handle joint changes (updated for bidirectional connections with max 2 connections)
  const handleJointChange = (index, field, value) => {
    const updatedJoints = [...formData.joints];

    if (field === "label") {
      // Check for duplicate labels
      const labelExists = updatedJoints.some(
        (joint, i) => i !== index && joint.label === value.toUpperCase()
      );
      if (labelExists) {
        alert("Joint labels must be unique.");
        return;
      }
      updatedJoints[index].label = value.toUpperCase();
    } else if (field === "connections") {
      const currentJoint = updatedJoints[index];
      const targetJoint = updatedJoints.find((joint) => joint.label === value);

      if (!targetJoint) return; // Safety check

      // Check if the current joint already has 2 connections
      if (
        currentJoint.connections.length >= 2 &&
        !currentJoint.connections.includes(value)
      ) {
        alert("Each joint can connect to a maximum of 2 other joints.");
        return;
      }

      // Check if the target joint already has 2 connections
      if (
        targetJoint.connections.length >= 2 &&
        !targetJoint.connections.includes(currentJoint.label)
      ) {
        alert(`Joint ${targetJoint.label} already has 2 connections.`);
        return;
      }

      // Update current joint's connections
      if (currentJoint.connections.includes(value)) {
        currentJoint.connections = currentJoint.connections.filter(
          (conn) => conn !== value
        );
      } else {
        currentJoint.connections.push(value);
      }

      // Update the target joint's connections (bidirectional)
      if (targetJoint.connections.includes(currentJoint.label)) {
        targetJoint.connections = targetJoint.connections.filter(
          (conn) => conn !== currentJoint.label
        );
      } else {
        targetJoint.connections.push(currentJoint.label);
      }
    }

    setFormData({ ...formData, joints: updatedJoints });
  };

  const handleSupportChange = (index, value) => {
    const updatedSupports = [...formData.supports];
    updatedSupports[index] = value;
    setFormData({ ...formData, supports: updatedSupports });
  };

  const handleMomentChange = (index, value) => {
    const updatedMoments = [...formData.momentsOfInertia];
    updatedMoments[index].value = value;
    setFormData({ ...formData, momentsOfInertia: updatedMoments });
  };

  const handleSpanChange = (index, value) => {
    const updatedSpans = [...formData.spans];
    updatedSpans[index].value = value;
    setFormData({ ...formData, spans: updatedSpans });
  };

  // Helper function to get connected pairs of joints
  const getConnectedPairs = () => {
    const pairs = [];
    const visited = new Set();

    formData.joints.forEach((joint) => {
      joint.connections.forEach((conn) => {
        const pairKey = [joint.label, conn].sort().join("-");
        if (!visited.has(pairKey)) {
          pairs.push({
            from: joint.label,
            to: conn,
            value: "",
          });
          visited.add(pairKey);
        }
      });
    });

    return pairs;
  };

  // Navigation between steps
  const nextStep = () => {
    if (step === 1) {
      const allLabelsFilled = formData.joints.every((joint) => joint.label);
      if (!allLabelsFilled) {
        alert("Please provide a label for each joint.");
        return;
      }
    } else if (step === 3) {
      const allMomentsFilled = formData.momentsOfInertia.every(
        (moment) => moment.value
      );
      if (!allMomentsFilled) {
        alert("Please provide a moment of inertia for each connection.");
        return;
      }
    } else if (step === 4) {
      const allSpansFilled = formData.spans.every((span) => span.value);
      if (!allSpansFilled) {
        alert("Please provide a length for each span.");
        return;
      }
      navigate("/results", { state: { formData, numIterations } });
      return;
    }

    // When moving to step 3 or 4, populate momentsOfInertia and spans based on connections
    if (step === 2) {
      const connectedPairs = getConnectedPairs();
      setFormData((prev) => ({
        ...prev,
        momentsOfInertia: connectedPairs,
        spans: connectedPairs.map((pair) => ({ ...pair })), // Clone for spans
      }));
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Step 1: Joint Form (Updated to reflect bidirectional connections with max 2 connections)
  const renderJointForm = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-blue-500 mb-4">Joint Names</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-gray-300">Joint Number</th>
              <th className="p-3 text-gray-300">Alphabetic Label</th>
              <th className="p-3 text-gray-300">Node Connection</th>
            </tr>
          </thead>
          <tbody>
            {formData.joints.map((joint, index) => (
              <tr key={index} className="border-t border-gray-600">
                <td className="p-3">{joint.jointNumber}</td>
                <td className="p-3">
                  <input
                    type="text"
                    value={joint.label}
                    onChange={(e) =>
                      handleJointChange(index, "label", e.target.value)
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., A"
                    maxLength="1"
                    required
                  />
                </td>
                <td className="p-3 flex space-x-2">
                  {formData.joints
                    .filter((_, i) => i !== index)
                    .map((otherJoint) => (
                      <label
                        key={otherJoint.jointNumber}
                        className="flex items-center"
                      >
                        <input
                          type="checkbox"
                          checked={joint.connections.includes(otherJoint.label)}
                          onChange={() =>
                            handleJointChange(
                              index,
                              "connections",
                              otherJoint.label
                            )
                          }
                          className="mr-1"
                          disabled={!joint.label || !otherJoint.label}
                        />
                        {otherJoint.label || `Joint ${otherJoint.jointNumber}`}
                      </label>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Step 2: Support Type Table
  const renderSupportForm = () => {
    // Mapping of support types to image URLs
    const supportImages = {
      Fixed: fixImg,
      Roller: rollerImg,
      Pin: pinImg,
    };
  
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-blue-500 mb-4">Support Types</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-gray-600">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 text-gray-300">Joint Label</th>
                <th className="p-3 text-gray-300">Support Type</th>
                <th className="p-3 text-gray-300">Support Visual</th>
              </tr>
            </thead>
            <tbody>
              {formData.joints.map((joint, index) => (
                <tr key={index} className="border-t border-gray-600">
                  <td className="p-3">{joint.label}</td>
                  <td className="p-3">
                    <select
                      value={formData.supports[index]}
                      onChange={(e) => handleSupportChange(index, e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Fixed">Fixed</option>
                      <option value="Roller">Roller</option>
                      <option value="Pin">Pin</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {formData.supports[index] && (
                      <img
                        src={supportImages[formData.supports[index]]}
                        alt={`${formData.supports[index]} support`}
                        className="w-16 h-16 object-contain bg-white"
                        onError={(e) => {
                          e.target.src = "/images/placeholder.png";
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Step 3: Moment of Inertia Form (Updated to be between connected joints)
  const renderMomentForm = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-blue-500 mb-4">
        Moment of Inertia
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-gray-300">Connection</th>
              <th className="p-3 text-gray-300">Moment of Inertia (I)</th>
            </tr>
          </thead>
          <tbody>
            {formData.momentsOfInertia.map((moment, index) => (
              <tr key={index} className="border-t border-gray-600">
                <td className="p-3">{`${moment.from} - ${moment.to}`}</td>
                <td className="p-3">
                  <input
                    type="number"
                    value={moment.value}
                    onChange={(e) => handleMomentChange(index, e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1000"
                    min="0"
                    required
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Step 4: Length of Span Form (Updated to be between connected joints)
  const renderSpanForm = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-blue-500 mb-4">
        Length of Span
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-gray-300">Span Between</th>
              <th className="p-3 text-gray-300">Length (m)</th>
            </tr>
          </thead>
          <tbody>
            {formData.spans.map((span, index) => (
              <tr key={index} className="border-t border-gray-600">
                <td className="p-3">{`${span.from} - ${span.to}`}</td>
                <td className="p-3">
                  <input
                    type="number"
                    value={span.value}
                    onChange={(e) => handleSpanChange(index, e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5"
                    min="0"
                    required
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={"/configuration"}>{`< Configurations`}</Link>
        {/* Step Indicator */}
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-1/4 text-center py-2 rounded ${
                step >= s ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              Step {s}
            </div>
          ))}
        </div>

        {/* Form Content */}
        {step === 1 && renderJointForm()}
        {step === 2 && renderSupportForm()}
        {step === 3 && renderMomentForm()}
        {step === 4 && renderSpanForm()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            className={`py-2 px-4 rounded-lg ${
              step === 1
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white transition duration-300`}
            disabled={step === 1}
          >
            Previous
          </button>
          <button
            onClick={nextStep}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300"
          >
            {step === 4 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputTables;
