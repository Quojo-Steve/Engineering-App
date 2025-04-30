import React from 'react';
import { useLocation } from 'react-router-dom';

const Results = () => {
  const { state } = useLocation();
  const { formData, numIterations } = state || {};

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold">Results Page</h2>
      <pre>{JSON.stringify(formData, null, 2)}</pre>
      <p>Number of Iterations: {numIterations}</p>
    </div>
  );
};

export default Results;