import React from 'react';

const LoadForm = ({ formData, setFormData, errors, setErrors }) => {
  const handleLoadChange = (index, field, value) => {
    const updatedLoads = [...formData.loads];
    const newErrors = { ...errors };

    // Find the span for the current load
    const span = formData.spans.find(
      (s) => s.from === updatedLoads[index].from && s.to === updatedLoads[index].to
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
        newErrors[index] = `Distance cannot be greater than the span length (${spanLength} m).`;
        setErrors(newErrors);
        return;
      }
      delete newErrors[index];
      updatedLoads[index].distance = value;
    }

    setFormData({ ...formData, loads: updatedLoads });
    setErrors(newErrors);
  };

  return (
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
                    onChange={(e) => handleLoadChange(index, "type", e.target.value)}
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
                    onChange={(e) => handleLoadChange(index, "value", e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10"
                    min="0"
                    required
                  />
                  {errors[index] && (
                    <span className="text-red-500 text-sm">{errors[index]}</span>
                  )}
                </td>
                <td className="p-3">
                  {load.type === "UDL" ? (
                    <span className="text-gray-500">0 (Full Span)</span>
                  ) : (
                    <input
                      type="number"
                      value={load.distance || ""}
                      onChange={(e) => handleLoadChange(index, "distance", e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2"
                      min="0"
                      required
                    />
                  )}
                  {errors[index] && load.type !== "UDL" && (
                    <span className="text-red-500 text-sm">{errors[index]}</span>
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

export default LoadForm;