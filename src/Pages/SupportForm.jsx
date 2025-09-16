import React from 'react';
import fixImg from "../assets/fix.png";
import rollerImg from "../assets/roller.png";
import pinImg from "../assets/pinned.png";
import nosupport from "../assets/nosupport.jpg";

const SupportForm = ({ formData, setFormData }) => {
  const supportImages = {
    Fixed: fixImg,
    Roller: rollerImg,
    Pin: pinImg,
    NoSupport: nosupport,
  };

  const handleSupportChange = (index, value) => {
    const updatedSupports = [...formData.supports];
    updatedSupports[index] = value;
    setFormData({ ...formData, supports: updatedSupports });
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
                    onChange={(e) => handleSupportChange(index, e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option
                      value="NoSupport"
                      disabled={index !== 0 && index !== formData.joints.length - 1}
                    >
                      No Support
                    </option>
                    <option
                      value="Fixed"
                      disabled={index !== 0 && index !== formData.joints.length - 1}
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

export default SupportForm;