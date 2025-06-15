import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import fixImg from '../assets/fix.png';
import rollerImg from '../assets/roller.png';
import pinImg from '../assets/pinned.png';
import nosupport from '../assets/nosupport.jpg';

const InputTables = () => {
  const { state } = useLocation();
  const numIterations = 30;
  const { numJoints } = state || {};
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    joints: Array.from({ length: numJoints }, (_, i) => ({
      jointNumber: i + 1,
      label: "",
      connections: [],
    })),
    supports: Array.from({ length: numJoints }, () => "Fixed"),
    momentsOfInertia: [],
    spans: [],
    loads: [],
  });

  // Handlers (unchanged)
  const handleJointChange = (index, field, value) => {
    const updatedJoints = [...formData.joints];
    if (field === "label") {
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
      if (!targetJoint) return;
      if (
        currentJoint.connections.length >= 2 &&
        !currentJoint.connections.includes(value)
      ) {
        alert("Each joint can connect to a maximum of 2 other joints.");
        return;
      }
      if (
        targetJoint.connections.length >= 2 &&
        !targetJoint.connections.includes(currentJoint.label)
      ) {
        alert(`Joint ${targetJoint.label} already has 2 connections.`);
        return;
      }
      if (currentJoint.connections.includes(value)) {
        currentJoint.connections = currentJoint.connections.filter(
          (conn) => conn !== value
        );
      } else {
        currentJoint.connections.push(value);
      }
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

  const handleLoadChange = (index, field, value) => {
    const updatedLoads = [...formData.loads];
    updatedLoads[index][field] = value;
    setFormData({ ...formData, loads: updatedLoads });
  };

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

  const calculateStiffnessFactors = () => {
    const stiffnessFactors = formData.spans.map((span, index) => {
      const fromJointIndex = formData.joints.findIndex(j => j.label === span.from);
      const toJointIndex = formData.joints.findIndex(j => j.label === span.to);
      const fromSupport = formData.supports[fromJointIndex];
      const toSupport = formData.supports[toJointIndex];
      const inertia = parseFloat(formData.momentsOfInertia[index].value);
      const length = parseFloat(span.value);

      let factor;
      if (fromSupport === "Fixed" || toSupport === "Fixed") {
        factor = (4 * inertia) / length;
      } else {
        factor = (3 * inertia) / length;
      }

      return {
        from: span.from,
        to: span.to,
        value: factor,
      };
    });

    return stiffnessFactors;
  };

  const calculateDistributionFactors = (stiffnessFactors) => {
    const distributionFactors = [];
    const totalStiffnessAtJoint = {};
    formData.joints.forEach(joint => {
      totalStiffnessAtJoint[joint.label] = 0;
    });

    stiffnessFactors.forEach(sf => {
      totalStiffnessAtJoint[sf.from] += sf.value;
      totalStiffnessAtJoint[sf.to] += sf.value;
    });

    formData.joints.forEach((joint, index) => {
      const supportType = formData.supports[index];
      joint.connections.forEach(toLabel => {
        let dfFromTo;
        if (supportType === "Fixed") {
          dfFromTo = 0;
        } else if ((supportType === "Roller" || supportType === "Pin") && joint.connections.length === 1) {
          dfFromTo = 1;
        } else {
          const stiffness = stiffnessFactors.find(sf => 
            (sf.from === joint.label && sf.to === toLabel) || 
            (sf.to === joint.label && sf.from === toLabel)
          ).value;
          dfFromTo = stiffness / totalStiffnessAtJoint[joint.label];
        }

        distributionFactors.push({
          from: joint.label,
          to: toLabel,
          value: dfFromTo,
        });
      });
    });

    return distributionFactors;
  };

  // New function to calculate Fixed End Moments
  const calculateFixedEndMoments = () => {
    const fixedEndMoments = formData.loads.map((load, index) => {
      const length = parseFloat(formData.spans[index].value);
      const weight = parseFloat(load.value);
      let fem;

      if (load.type === "Distributed") { // UDL
        fem = (weight * length * length) / 12;
      } else if (load.type === "Point") { // PL
        fem = (weight * length) / 8;
      }

      return {
        from: load.from,
        to: load.to,
        femFromTo: -fem,  // Negative at 'from' end (convention: counterclockwise)
        femToFrom: fem,   // Positive at 'to' end (convention: clockwise)
      };
    });

    return fixedEndMoments;
  };

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
    } else if (step === 5) {
      const allLoadsFilled = formData.loads.every(
        (load) => load.type && load.value
      );
      if (!allLoadsFilled) {
        alert("Please provide a load type and value for each span.");
        return;
      }
      const stiffnessFactors = calculateStiffnessFactors();
      const distributionFactors = calculateDistributionFactors(stiffnessFactors);
      const fixedEndMoments = calculateFixedEndMoments();
      navigate("/results", { 
        state: { 
          formData: { ...formData, stiffnessFactors, distributionFactors, fixedEndMoments }, 
          numIterations 
        } 
      });
      return;
    }

    if (step === 2) {
      const connectedPairs = getConnectedPairs();
      setFormData((prev) => ({
        ...prev,
        momentsOfInertia: connectedPairs,
        spans: connectedPairs.map((pair) => ({ ...pair })),
        loads: connectedPairs.map((pair) => ({ ...pair, type: "Point", value: "" })),
      }));
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Render functions (unchanged)
  const renderJointForm = () => {
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
        <h3 className="text-xl font-semibold text-blue-500 mb-4">Joint Names</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-gray-600">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 text-gray-300">Joint</th>
                <th className="p-3 text-gray-300">Alphabetic Label</th>
                <th className="p-3 text-gray-300">Node Connection</th>
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
  };

  const renderSupportForm = () => {
    const supportImages = {
      Fixed: fixImg,
      Roller: rollerImg,
      Pin: pinImg,
      NoSupport: nosupport,
    };

    return (
      <div className="bg-gray-800 p-2 md:p-6 rounded-lg shadow-lg">
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
                      <option value="NoSupport">No Support</option>
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

  const renderMomentForm = () => (
    <div className="bg-gray-800 p-2 md:p-6 rounded-lg shadow-lg">
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

  const renderSpanForm = () => (
    <div className="bg-gray-800 p-2 md:p-6 rounded-lg shadow-lg">
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

  const renderLoadForm = () => (
    <div className="bg-gray-800 p-2 md:p-6 rounded-lg shadow-lg">
    <h3 className="text-xl font-semibold text-blue-500 mb-4">Loads on Spans</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left border border-gray-600">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-3 text-gray-300">Span Between</th>
            <th className="p-3 text-gray-300">Load Type</th>
            <th className="p-3 text-gray-300">Load Value (kN or kN/m)</th>
            <th className="p-3 text-gray-300">Distance from Start (m)</th>
          </tr>
        </thead>
        <tbody>
          {formData.loads.map((load, index) => (
            <tr key={index} className="border-t border-gray-600">
              <td className="p-3">{`${load.from} - ${load.to}`}</td>
              <td className="p-3">
                <select
                  value={load.type}
                  onChange={(e) => handleLoadChange(index, "type", e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Point">Point Load (kN)</option>
                  <option value="Distributed">Uniform Distributed Load (kN/m)</option>
                </select>
              </td>
              <td className="p-3">
                <input
                  type="number"
                  value={load.value}
                  onChange={(e) => handleLoadChange(index, "value", e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 10"
                  min="0"
                  required
                />
              </td>
              <td className="p-3">
                {load.type === "Point" ? (
                  <input
                    type="number"
                    value={load.distance || ""}
                    onChange={(e) => handleLoadChange(index, "distance", e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2"
                    min="0"
                    required
                  />
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );

return (
  <div className="min-h-screen bg-gray-900 text-white p-2 md:p-6">
    <div className="max-w-4xl mx-auto">
      <Link to="/configuration" className="text-blue-400 hover:underline">
        &larr; Configurations
      </Link>

      {/* Step Indicator with lines between dots */}
      <div className="flex items-center justify-between mt-8 mb-12">
        {[1, 2, 3, 4, 5].map((s, idx) => (
          <React.Fragment key={s}>
            {/* Step Dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300
                  ${step === s ? "border-blue-600 bg-blue-600 font-bold" 
                  : step > s ? "border-blue-600 bg-gray-900" 
                  : "border-gray-500 bg-gray-900"}`}
              >
                <span className={`${step >= s ? "text-white" : "text-gray-400"}`}>{s}</span>
              </div>
              <span className={`mt-2 text-xs ${step >= s ? "text-white" : "text-gray-500"}`}>
                Step {s}
              </span>
            </div>

            {/* Connecting line (only between steps) */}
            {idx < 4 && (
              <div className="flex-1 h-1 bg-gray-600 mx-2 relative">
                <div
                  className="absolute h-full bg-blue-600 transition-all duration-500"
                  style={{
                    width: step > s ? "100%" : "0%",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-gray-800 p-2 md:p-6 rounded-xl shadow-xl transition-all duration-300">
        {step === 1 && renderJointForm()}
        {step === 2 && renderSupportForm()}
        {step === 3 && renderMomentForm()}
        {step === 4 && renderSpanForm()}
        {step === 5 && renderLoadForm()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className={`py-2 px-6 rounded-lg transition duration-300 font-semibold 
            ${step === 1 
              ? "bg-gray-600 cursor-not-allowed text-gray-300" 
              : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          disabled={step === 1}
        >
          Previous
        </button>

        <button
          onClick={nextStep}
          className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition duration-300"
        >
          {step === 5 ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  </div>
);
};

export default InputTables;