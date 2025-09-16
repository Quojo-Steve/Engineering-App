import React from 'react';

const SpanForm = ({ formData, setFormData }) => {
  const handleSpanChange = (index, value) => {
    const updatedSpans = [...formData.spans];
    updatedSpans[index].value = value;
    setFormData({ ...formData, spans: updatedSpans });
  };

  return (
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
};

export default SpanForm;