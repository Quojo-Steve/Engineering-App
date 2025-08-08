import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import fixImg from "../assets/fix.png";
import rollerImg from "../assets/roller.png";
import pinImg from "../assets/pinned.png";
import nosupport from "../assets/nosupport.jpg";

const InputTables = () => {
  const { state } = useLocation();
  const [errors, setErrors] = useState({});
  const numIterations = 30;
  const { numJoints } = state || {};
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    joints: Array.from({ length: numJoints }, (_, i) => ({
      Support_Number: i + 1,
      Label: "",
      Span_To: [],
    })),
    supports: Array.from({ length: numJoints }, () => "Roller"),
    momentsOfInertia: [],
    spans: [],
    loads: [],
    crossSections: [],
  });

  const handleJointChange = (index, field, value) => {
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
    } else if (field === "connections") {
      const currentJoint = updatedJoints[index];
      const targetJoint = updatedJoints.find((joint) => joint.Label === value);
      if (!targetJoint) return;
      if (
        currentJoint.Span_To.length >= 2 &&
        !currentJoint.Span_To.includes(value)
      ) {
        alert("Each joint can connect to a maximum of 2 other joints.");
        return;
      }
      if (
        targetJoint.Span_To.length >= 2 &&
        !targetJoint.Span_To.includes(currentJoint.Label)
      ) {
        alert(`Joint ${targetJoint.Label} already has 2 connections.`);
        return;
      }
      if (currentJoint.Span_To.includes(value)) {
        currentJoint.Span_To = currentJoint.Span_To.filter(
          (conn) => conn !== value
        );
      } else {
        currentJoint.Span_To.push(value);
      }
      if (targetJoint.Span_To.includes(currentJoint.Label)) {
        targetJoint.Span_To = targetJoint.Span_To.filter(
          (conn) => conn !== currentJoint.Label
        );
      } else {
        targetJoint.Span_To.push(currentJoint.Label);
      }
    }
    setFormData({ ...formData, joints: updatedJoints });
  };

  const handleSupportChange = (index, value) => {
    const updatedSupports = [...formData.supports];
    updatedSupports[index] = value;
    setFormData({ ...formData, supports: updatedSupports });
  };

  const handleCrossSectionChange = (index, field, value) => {
    const updatedCrossSections = [...formData.crossSections];
    updatedCrossSections[index][field] = value;

    let inertia = 0;
    if (updatedCrossSections[index].Cross_Section === "Rectangular") {
      const { width, height } = updatedCrossSections[index];
      if (width && height) {
        inertia = (parseFloat(width) * parseFloat(height) ** 3) / 12;
      }
    } else if (updatedCrossSections[index].Cross_Section === "Circular") {
      const { diameter } = updatedCrossSections[index];
      if (diameter) {
        inertia = (Math.PI * parseFloat(diameter) ** 4) / 64;
      }
    }
    updatedCrossSections[index].momentOfInertia = inertia;
    setFormData({
      ...formData,
      momentsOfInertia: updatedCrossSections,
      crossSections: updatedCrossSections,
    });
  };

  const handleSpanChange = (index, value) => {
    const updatedSpans = [...formData.spans];
    updatedSpans[index].value = value;
    setFormData({ ...formData, spans: updatedSpans });
  };

  const handleLoadChange = (index, field, value) => {
    const updatedLoads = [...formData.loads];
    const newErrors = { ...errors };

    // Find the span for the current load
    const span = formData.spans.find(
      (s) =>
        s.from === updatedLoads[index].from && s.to === updatedLoads[index].to
    );
    const spanLength = parseFloat(span?.value);

    // Validate span length
    if (isNaN(spanLength)) {
      newErrors[index] = "Please provide a valid span length first.";
      setErrors(newErrors);
      return;
    }

    if (field === "type") {
      updatedLoads[index].type = value;
      if (value === "UDL") {
        // For UDL, set distance to 0 and remove endDistance
        updatedLoads[index].distance = "0";
        delete updatedLoads[index].endDistance;
        delete newErrors[index];
      } else {
        // For Point Load, clear endDistance
        delete updatedLoads[index].endDistance;
      }
    }

    if (field === "value") {
      const loadValue = parseFloat(value);
      if (loadValue < 0) {
        newErrors[index] = "Load value cannot be negative.";
        setErrors(newErrors);
        return;
      }
      delete newErrors[index];
      updatedLoads[index].value = value;
    }

    if (field === "distance" && updatedLoads[index].type !== "UDL") {
      const distance = parseFloat(value);
      if (distance < 0) {
        newErrors[index] = "Distance cannot be negative.";
        setErrors(newErrors);
        return;
      }
      if (distance > spanLength) {
        newErrors[
          index
        ] = `Distance cannot be greater than the span length (${spanLength} m).`;
        setErrors(newErrors);
        return;
      }
      delete newErrors[index];
      updatedLoads[index].distance = value;
    }

    setFormData({ ...formData, loads: updatedLoads });
    setErrors(newErrors);
  };

  const getConnectedPairs = () => {
    const pairs = [];
    const visited = new Set();
    formData.joints.forEach((joint) => {
      joint.Span_To.forEach((conn) => {
        const pairKey = [joint.Label, conn].sort().join("-");
        if (!visited.has(pairKey)) {
          pairs.push({
            from: joint.Label,
            to: conn,
            value: "",
            Cross_Section: "Rectangular",
            width: "",
            height: "",
            diameter: "",
            momentOfInertia: 0,
          });
          visited.add(pairKey);
        }
      });
    });
    return pairs;
  };

  const calculateStiffnessFactors = () => {
    const stiffnessFactors = formData.spans.map((span, index) => {
      const fromJointIndex = formData.joints.findIndex(
        (j) => j.Label === span.from
      );
      const toJointIndex = formData.joints.findIndex(
        (j) => j.Label === span.to
      );
      const fromSupport = formData.supports[fromJointIndex];
      const toSupport = formData.supports[toJointIndex];
      const inertia = parseFloat(
        formData.momentsOfInertia[index].momentOfInertia
      );
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
    formData.joints.forEach((joint) => {
      totalStiffnessAtJoint[joint.Label] = 0;
    });

    stiffnessFactors.forEach((sf) => {
      totalStiffnessAtJoint[sf.from] += sf.value;
      totalStiffnessAtJoint[sf.to] += sf.value;
    });

    formData.joints.forEach((joint, index) => {
      const supportType = formData.supports[index];
      joint.Span_To.forEach((toLabel) => {
        let dfFromTo;
        if (supportType === "Fixed" || supportType === "NoSupport") {
          dfFromTo = 0;
        } else if (
          (supportType === "Roller" || supportType === "Pin") &&
          joint.Span_To.length === 1
        ) {
          dfFromTo = 1;
        } else {
          const stiffness = stiffnessFactors.find(
            (sf) =>
              (sf.from === joint.Label && sf.to === toLabel) ||
              (sf.to === joint.Label && sf.from === toLabel)
          ).value;
          dfFromTo = stiffness / totalStiffnessAtJoint[joint.Label];
        }

        distributionFactors.push({
          from: joint.Label,
          to: toLabel,
          value: dfFromTo,
        });
      });
    });

    return distributionFactors;
  };

  const calculateFixedEndMoments = () => {
    const fixedEndMoments = formData.loads.map((load, index) => {
      const span = formData.spans.find(
        (s) => s.from === load.from && s.to === load.to
      );
      const length = parseFloat(span?.value);
      const weight = parseFloat(load.value);

      let femFromTo = 0;
      let femToFrom = 0;

      if (load.type === "UDL") {
        // UDL covers the entire span
        femFromTo = -((weight * length * length) / 12); // -wL²/12
        femToFrom = (weight * length * length) / 12; // wL²/12
      } else if (load.type === "Point Load") {
        const a = parseFloat(load.distance); // Distance from left (from)
        const b = length - a;

        if (a === b) {
          // Point load at center: PL/8
          const fem = (weight * length) / 8;
          femFromTo = -fem;
          femToFrom = fem;
        } else {
          // Point load at arbitrary position
          femFromTo = -(weight * a * b ** 2) / length ** 2;
          femToFrom = (weight * a ** 2 * b) / length ** 2;
        }
      }

      return {
        from: load.from,
        to: load.to,
        femFromTo: parseFloat(femFromTo.toFixed(3)),
        femToFrom: parseFloat(femToFrom.toFixed(3)),
      };
    });

    return fixedEndMoments;
  };

  const nextStep = () => {
    if (step === 1) {
      const allLabelsFilled = formData.joints.every((joint) => joint.Label);
      if (!allLabelsFilled) {
        alert("Please provide a label for each joint.");
        return;
      }
    } else if (step === 3) {
      const allMomentsFilled = formData.momentsOfInertia.every(
        (moment) => moment.momentOfInertia > 0
      );
      if (!allMomentsFilled) {
        alert("Please provide valid cross-section parameters for each span.");
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
      const distributionFactors =
        calculateDistributionFactors(stiffnessFactors);
      const fixedEndMoments = calculateFixedEndMoments();
      navigate("/results", {
        state: {
          formData: {
            ...formData,
            stiffnessFactors,
            distributionFactors,
            fixedEndMoments,
          },
          numIterations,
        },
      });
      return;
    }

    if (step === 2) {
      const connectedPairs = getConnectedPairs();
      setFormData((prev) => ({
        ...prev,
        momentsOfInertia: connectedPairs,
        crossSections: connectedPairs,
        spans: connectedPairs.map((pair) => ({ ...pair })),
        loads: connectedPairs.map((pair) => ({
          ...pair,
          type: "Point Load",
          value: "",
          distance: "",
        })),
      }));
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

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
        <h3 className="text-xl font-semibold text-blue-500 mb-4">
          Joint Names
        </h3>
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
                      value={joint.Label}
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
                          key={otherJoint.Support_Number}
                          className="flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={joint.Span_To.includes(otherJoint.Label)}
                            onChange={() =>
                              handleJointChange(
                                index,
                                "connections",
                                otherJoint.Label
                              )
                            }
                            className="mr-1"
                            disabled={!joint.Label || !otherJoint.Label}
                          />
                          {otherJoint.Label ||
                            `Joint ${otherJoint.Support_Number}`}
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
        <h3 className="text-xl font-semibold text-blue-500 mb-4">
          Support Types
        </h3>
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
                  <td className="p-3">{joint.Label}</td>
                  <td className="p-3">
                    <select
                      value={formData.supports[index]}
                      onChange={(e) =>
                        handleSupportChange(index, e.target.value)
                      }
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option
                        value="NoSupport"
                        disabled={
                          index !== 0 && index !== formData.joints.length - 1
                        }
                      >
                        No Support
                      </option>
                      <option
                        value="Fixed"
                        disabled={
                          index !== 0 && index !== formData.joints.length - 1
                        }
                      >
                        Fixed
                      </option>
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

  const renderCrossSectionForm = () => (
    <div className="bg-gray-800 p-2 md:p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-blue-500 mb-4">
        Cross-Section Properties
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-gray-300">Span</th>
              <th className="p-3 text-gray-300">Cross_Section</th>
              <th className="p-3 text-gray-300">Parameters</th>
              <th className="p-3 text-gray-300">Moment of Inertia (mm⁴)</th>
            </tr>
          </thead>
          <tbody>
            {formData.crossSections.map((section, index) => (
              <tr key={index} className="border-t border-gray-600">
                <td className="p-3">{`${section.from} - ${section.to}`}</td>
                <td className="p-3">
                  <select
                    value={section.Cross_Section}
                    onChange={(e) =>
                      handleCrossSectionChange(
                        index,
                        "Cross_Section",
                        e.target.value
                      )
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Rectangular">Rectangular</option>
                    <option value="Circular">Circular</option>
                  </select>
                </td>
                <td className="p-3">
                  {section.Cross_Section === "Rectangular" ? (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={section.width}
                        onChange={(e) =>
                          handleCrossSectionChange(
                            index,
                            "width",
                            e.target.value
                          )
                        }
                        className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Width (mm)"
                        min="0"
                        required
                      />
                      <input
                        type="number"
                        value={section.height}
                        onChange={(e) =>
                          handleCrossSectionChange(
                            index,
                            "height",
                            e.target.value
                          )
                        }
                        className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Height (mm)"
                        min="0"
                        required
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={section.diameter}
                      onChange={(e) =>
                        handleCrossSectionChange(
                          index,
                          "diameter",
                          e.target.value
                        )
                      }
                      className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Diameter (mm)"
                      min="0"
                      required
                    />
                  )}
                </td>
                <td className="p-3">
                  {section.momentOfInertia.toFixed(2) || "0.00"}
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
              <th className="p-3 text-gray-300">Span</th>
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
      <h3 className="text-xl font-semibold text-blue-500 mb-4">
        Loading Conditions
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-gray-300">Span Between</th>
              <th className="p-3 text-gray-300">Load Type</th>
              <th className="p-3 text-gray-300">Load Value (kN or kN/m)</th>
              <th className="p-3 text-gray-300">Start Distance (m)</th>
            </tr>
          </thead>
          <tbody>
            {formData.loads.map((load, index) => (
              <tr key={index} className="border-t border-gray-600">
                <td className="p-3">{`${load.from} - ${load.to}`}</td>
                <td className="p-3">
                  <select
                    value={load.type}
                    onChange={(e) =>
                      handleLoadChange(index, "type", e.target.value)
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Point Load">Point Load (kN)</option>
                    <option value="UDL">Uniform Distributed Load (kN/m)</option>
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={load.value}
                    onChange={(e) =>
                      handleLoadChange(index, "value", e.target.value)
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10"
                    min="0"
                    required
                  />
                  {errors[index] && (
                    <span className="text-red-500 text-sm">
                      {errors[index]}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {load.type === "UDL" ? (
                    <span className="text-gray-500">0 (Full Span)</span>
                  ) : (
                    <input
                      type="number"
                      value={load.distance || ""}
                      onChange={(e) =>
                        handleLoadChange(index, "distance", e.target.value)
                      }
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2"
                      min="0"
                      required
                    />
                  )}
                  {errors[index] && load.type !== "UDL" && (
                    <span className="text-red-500 text-sm">
                      {errors[index]}
                    </span>
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
          ← Configurations
        </Link>
        <div className="flex items-center justify-between mt-8 mb-12">
          {[1, 2, 3, 4, 5].map((s, idx) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300
                  ${
                    step === s
                      ? "border-blue-600 bg-blue-600 font-bold"
                      : step > s
                      ? "border-blue-600 bg-gray-900"
                      : "border-gray-500 bg-gray-900"
                  }`}
                >
                  <span
                    className={`${step >= s ? "text-white" : "text-gray-400"}`}
                  >
                    {s}
                  </span>
                </div>
                <span
                  className={`mt-2 text-xs ${
                    step >= s ? "text-white" : "text-gray-500"
                  }`}
                >
                  Step {s}
                </span>
              </div>
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
        <div className="bg-gray-800 p-2 md:p-6 rounded-xl shadow-xl transition-all duration-300">
          {step === 1 && renderJointForm()}
          {step === 2 && renderSupportForm()}
          {step === 3 && renderCrossSectionForm()}
          {step === 4 && renderSpanForm()}
          {step === 5 && renderLoadForm()}
        </div>
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            className={`py-2 px-6 rounded-lg transition duration-300 font-semibold 
            ${
              step === 1
                ? "bg-gray-600 cursor-not-allowed text-gray-300"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
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