import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Configuration = () => {
  // State to store form inputs
  const [numJoints, setNumJoints] = useState('');
  const [numIterations, setNumIterations] = useState('');
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numJoints || !numIterations) {
      alert('Please fill in both fields.');
      return;
    }
    // Navigate to the next page, passing the data
    navigate('/input-tables', { state: { numJoints, numIterations } });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
        {/* Form Heading */}
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-500">
          Configuration
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Number of Joints Fieldset */}
          <fieldset className="mb-6">
            <legend className="text-lg font-semibold text-gray-300 mb-2">
              Structural Setup
            </legend>
            <div className="mb-4">
              <label
                htmlFor="numJoints"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Number of Joints <span className='text-gray-500 font-light text-xs'>(not more than 10)</span>
              </label>
              <input
                type="number"
                id="numJoints"
                value={numJoints}
                onChange={(e) => setNumJoints(e.target.value)}
                min="2" // Minimum 2 joints for a meaningful structure
                max={10}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3"
                required
              />
            </div>
          </fieldset>

          {/* Number of Iterations Fieldset */}
          <fieldset className="mb-6">
            <legend className="text-lg font-semibold text-gray-300 mb-2">
              Calculation Settings
            </legend>
            <div className="mb-4">
              <label
                htmlFor="numIterations"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Number of Iterations <span className='text-gray-500 font-light text-xs'>(not more than 30)</span>
              </label>
              <input
                type="number"
                id="numIterations"
                value={numIterations}
                onChange={(e) => setNumIterations(e.target.value)}
                min="1" // Minimum 1 iteration
                max={30}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
                required
              />
            </div>
          </fieldset>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition duration-300"
          >
            Proceed to Calculation
          </button>
        </form>
      </div>
    </div>
  );
};

export default Configuration;