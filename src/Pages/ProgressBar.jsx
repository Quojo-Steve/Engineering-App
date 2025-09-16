import React from 'react';

const ProgressBar = ({ step }) => {
  return (
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
              <span className={`${step >= s ? "text-white" : "text-gray-400"}`}>
                {s}
              </span>
            </div>
            <span
              className={`mt-2 text-xs ${step >= s ? "text-white" : "text-gray-500"}`}
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
  );
};

export default ProgressBar;