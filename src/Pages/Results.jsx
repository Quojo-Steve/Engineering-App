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

  // Helper component to display any array of objects with units
  const DisplayArray = ({ title, data }) => {
    if (!data || data.length === 0) return null;

    const units = {
      length: "m",
      momentOfInertia: "m⁴",
      value: (item) =>
        item.type === "Point Load"
          ? "kN"
          : item.type === "UDL"
          ? "kN/m"
          : title === "Spans"
          ? "m"
          : typeof item.value === "number"
          ? ""
          : "",
      distance: "m",
      endDistance: "m",
      femFromTo: "kNm",
      femToFrom: "kNm",
      width: "m",
      height: "m",
      diameter: "m",
    };

    const capitalizedTitle = title.replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">{capitalizedTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => {
            const shape = item.Cross_Section || item.CrossSection || "";
            const content = [];

            // Show "Span: AB" if both from and to exist
            if (item.from && item.to) {
              content.push(
                <p key="span">
                  <span className="font-semibold">Span:</span> {item.from}
                  {item.to}
                </p>
              );
            }

            Object.entries(item).forEach(([key, value]) => {
              if (
                value === "" ||
                value === null ||
                value === undefined ||
                key === "from" ||
                key === "to"
              )
                return;

              if (
                (title === "Spans" && key === "momentOfInertia") ||
                (title === "Loading Conditions" &&
                  (key === "Cross_Section" || key === "momentOfInertia")) ||
                (title === "Moments Of Inertia" && key === "value")
              ) {
                return;
              }

              if (key === "diameter" && shape !== "Circular") return;
              if (
                (key === "width" || key === "height") &&
                shape !== "Rectangular"
              )
                return;

              // Dynamic labels for FEMs using joint names
              if (title === "Fixed End Moments") {
                if (key === "femFromTo") {
                  const sub = `${item.from || "A"}${item.to || "B"}`;
                  content.push(
                    <p key={key}>
                      <span
                        className="font-semibold"
                        dangerouslySetInnerHTML={{
                          __html: `M<sup>F</sup><sub>${sub}</sub>:`,
                        }}
                      />{" "}
                      {value} (kNm)
                    </p>
                  );
                  return;
                }
                if (key === "femToFrom") {
                  const sub = `${item.to || "B"}${item.from || "A"}`;
                  content.push(
                    <p key={key}>
                      <span
                        className="font-semibold"
                        dangerouslySetInnerHTML={{
                          __html: `M<sup>F</sup><sub>${sub}</sub>:`,
                        }}
                      />{" "}
                      {value} (kNm)
                    </p>
                  );
                  return;
                }
              }

              const displayKey =
                key === "value" && title === "Spans"
                  ? "Length"
                  : key === "Cross_Section"
                  ? "Shape"
                  : key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase());

              const unit =
                typeof units[key] === "function"
                  ? units[key](item)
                  : units[key] || "";

              content.push(
                <p key={key}>
                  <span className="font-semibold">{displayKey}:</span>{" "}
                  {Array.isArray(value) ? value.join(", ") : value}{" "}
                  {unit ? `(${unit})` : ""}
                </p>
              );
            });

            return (
              <div key={index} className="border p-4 rounded-lg shadow-sm">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper component to display simple arrays (like supports)
  const DisplaySimpleArray = ({ title, data }) => {
    if (!data || data.length === 0) return null;

    // Capitalize header
    const capitalizedTitle = title.replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">{capitalizedTitle}</h3>
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

      {formData.joints && (
        <DisplayArray title="Joints" data={formData.joints} />
      )}
      {formData.spans && <DisplayArray title="Spans" data={formData.spans} />}
      {formData.loads && (
        <DisplayArray title="Loading Conditions" data={formData.loads} />
      )}
      {formData.supports && (
        <DisplaySimpleArray title="Support Types" data={formData.supports} />
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
          data={formData.distributionFactors.map((item) => ({
            ...item,
            value: item.value === null ? "0" : item.value, // Handle null values
          }))}
        />
      )}

      {/* Raw data view for debugging */}
      {/* <details className="mt-8 border rounded-lg p-4">
        <summary className="font-bold cursor-pointer">Raw Data</summary>
        <pre className="bg-gray-100 p-4 mt-2 rounded overflow-x-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </details> */}

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
