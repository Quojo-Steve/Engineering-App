import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import Configuration from './Pages/Configuration';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/configuration" element={<Configuration />} />
        {/* <Route path="/contact" element={<Contact />} /> */}
      </Routes>
    </div>
  );
}

export default App;
