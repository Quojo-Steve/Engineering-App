import React from "react";
import { useLocation } from "react-router-dom";
import BeamDiagram from "./BeamDiagram";
import MomentDistributionTable from "./MomentDistributionTable";

const Results = () => {
  const { state } = useLocation();
  const { formData, numIterations } = state || {};

  if (!state) {
    return <div>No data received. Please submit the form first.</div>;
  }

  // Helper component to display any array of objects
  const DisplayArray = ({ title, data }) => {
    if (!data || data.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div key={index} className="border p-4 rounded-lg shadow-sm">
              {Object.entries(item).map(([key, value]) => (
                <p key={key}>
                  <span className="font-semibold">{key}:</span>{" "}
                  {Array.isArray(value) ? value.join(", ") : value}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper component to display simple arrays (like supports)
  const DisplaySimpleArray = ({ title, data }) => {
    if (!data || data.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {data.map((item, index) => (
            <span key={index} className="bg-gray-100 px-3 py-1 rounded-full">
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Analysis Results</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Iterations</h2>
        <p className="text-lg">{numIterations}</p>
      </div>

      {formData.joints && (
        <DisplayArray title="Joints" data={formData.joints} />
      )}
      {formData.spans && <DisplayArray title="Spans" data={formData.spans} />}
      {formData.loads && <DisplayArray title="Loads" data={formData.loads} />}
      {formData.supports && (
        <DisplaySimpleArray title="Supports" data={formData.supports} />
      )}
      {formData.fixedEndMoments && (
        <DisplayArray
          title="Fixed End Moments"
          data={formData.fixedEndMoments}
        />
      )}
      {formData.momentsOfInertia && (
        <DisplayArray
          title="Moments of Inertia"
          data={formData.momentsOfInertia}
        />
      )}
      {formData.stiffnessFactors && (
        <DisplayArray
          title="Stiffness Factors"
          data={formData.stiffnessFactors}
        />
      )}
      {formData.distributionFactors && (
        <DisplayArray
          title="Distribution Factors"
          data={formData.distributionFactors}
        />
      )}

      {/* Raw data view for debugging */}
      <details className="mt-8 border rounded-lg p-4">
        <summary className="font-bold cursor-pointer">Raw Data</summary>
        <pre className="bg-gray-100 p-4 mt-2 rounded overflow-x-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </details>

      <BeamDiagram
        joints={formData.joints}
        spans={formData.spans}
        supports={formData.supports}
        loads={formData.loads}
        fixedEndMoments={formData.fixedEndMoments}
      />

      <MomentDistributionTable
        joints={formData.joints}
        spans={formData.spans}
        supports={formData.supports}
        fixedEndMoments={formData.fixedEndMoments}
        distributionFactors={formData.distributionFactors}
      />
    </div>
  );
};

export default Results;
