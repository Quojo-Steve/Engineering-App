import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import Configuration from './Pages/Configuration';
import InputTables from './Pages/InputTables';
import Results from './Pages/Results';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/configuration" element={<Configuration />} />
        <Route path="/input-tables" element={<InputTables />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </div>
  );
}

export default App;
