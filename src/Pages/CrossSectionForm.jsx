import React from 'react';

const CrossSectionForm = ({ formData, setFormData }) => {
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

  return (
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
              <th className="p-3 text-gray-300">Moment of Inertia (m⁴)</th>
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
                      handleCrossSectionChange(index, "Cross_Section", e.target.value)
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
                          handleCrossSectionChange(index, "width", e.target.value)
                        }
                        className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Width (m)"
                        min="0"
                        required
                      />
                      <input
                        type="number"
                        value={section.height}
                        onChange={(e) =>
                          handleCrossSectionChange(index, "height", e.target.value)
                        }
                        className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Height (m)"
                        min="0"
                        required
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={section.diameter}
                      onChange={(e) =>
                        handleCrossSectionChange(index, "diameter", e.target.value)
                      }
                      className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Diameter (mm)"
                      min="0"
                      required
                    />
                  )}
                </td>
                <td className="p-3">
                  {section.momentOfInertia.toFixed(10) || "0.00"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CrossSectionForm;