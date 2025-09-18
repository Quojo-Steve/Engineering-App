import React, { useState, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import JointForm from "./JointForm";
import SupportForm from "./SupportForm";
import CrossSectionForm from "./CrossSectionForm";
import SpanForm from "./SpanForm";
import LoadForm from "./LoadForm";
import ProgressBar from "./ProgressBar";
import {
  getConnectedPairs,
  calculateStiffnessFactors,
  calculateDistributionFactors,
  calculateFixedEndMoments,
} from "./utils";

const InputTables = () => {
  const { state } = useLocation();
  const numIterations = state?.numIterations || 30;
  const { numJoints, formData: initialFormData } = state || {};
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(
    initialFormData || {
      joints: Array.from({ length: numJoints || 0 }, (_, i) => ({
        Support_Number: i + 1,
        Label: "",
        Span_To: [],
      })),
      supports: Array.from({ length: numJoints || 0 }, () => "Roller"),
      momentsOfInertia: [],
      spans: [],
      loads: [],
      crossSections: [],
    }
  );

  // Determine if the Next/Submit button should be disabled based on the current step
  const isNextButtonDisabled = useMemo(() => {
    if (step === 1) {
      return !formData.joints.every((joint) => joint.Label);
    } else if (step === 2) {
      // Support types are always pre-filled with "Roller", so button is always enabled
      return false;
    } else if (step === 3) {
      return !formData.momentsOfInertia.every(
        (moment) => moment.momentOfInertia > 0
      );
    } else if (step === 4) {
      return !formData.spans.every((span) => span.value);
    } else if (step === 5) {
      return !formData.loads.every((load) => load.type && load.value);
    }
    return false;
  }, [step, formData]);

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
      const stiffnessFactors = calculateStiffnessFactors(formData);
      const distributionFactors = calculateDistributionFactors(formData, stiffnessFactors);
      const fixedEndMoments = calculateFixedEndMoments(formData);
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
      // Only initialize if arrays are empty or undefined
      if (
        !formData.momentsOfInertia.length ||
        !formData.crossSections.length ||
        !formData.spans.length ||
        !formData.loads.length
      ) {
        const connectedPairs = getConnectedPairs(formData);
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
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/configuration" className="text-blue-400 hover:underline">
          ← Configurations
        </Link>
        <ProgressBar step={step} />
        <div className="bg-gray-800 p-2 md:p-6 rounded-xl shadow-xl transition-all duration-300">
          {step === 1 && <JointForm formData={formData} setFormData={setFormData} />}
          {step === 2 && <SupportForm formData={formData} setFormData={setFormData} />}
          {step === 3 && <CrossSectionForm formData={formData} setFormData={setFormData} />}
          {step === 4 && <SpanForm formData={formData} setFormData={setFormData} />}
          {step === 5 && <LoadForm formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} />}
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
            className={`py-2 px-6 rounded-lg transition duration-300 font-semibold 
            ${
              isNextButtonDisabled
                ? "bg-gray-600 cursor-not-allowed text-gray-300"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            disabled={isNextButtonDisabled}
          >
            {step === 5 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputTables;