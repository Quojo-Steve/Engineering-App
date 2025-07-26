import React, { useState } from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-950 bg-opacity-90 fixed w-full top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <a href="/" className="text-2xl font-bold text-blue-500">
            StructuraCalc
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 md:items-center">
            <a href="#home" className="hover:text-blue-400 transition">Home</a>
            <a href="#about" className="hover:text-blue-400 transition">About</a>
            <Link to={"/configuration"} className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg transition shadow">
              Start Calculating
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-gray-950 bg-opacity-95 text-center py-4">
            <a href="#home" className="block py-2 hover:text-blue-400">Home</a>
            <a href="#about" className="block py-2 hover:text-blue-400">About</a>
            <Link to={"/configuration"} className="block py-2 bg-blue-600 hover:bg-blue-700 mx-6 rounded-lg transition">Start Calculating</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div
        id="home"
        className="flex items-center justify-center min-h-screen text-white text-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/1141853/pexels-photo-1141853.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="max-w-3xl px-6">
          <h1 className="text-4xl md:text-6xl font-bold">Moment Distribution Calculator</h1>
          <p className="text-lg text-gray-300 mt-4">
            Simplify structural analysis with our fast, accurate, and easy-to-use tool.
          </p>
          <Link
            to={"/configuration"}
            className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition duration-300"
          >
            Start Calculating Now
          </Link>
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="py-16 px-6 bg-gray-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">About This Tool</h2>
          <p className="text-lg text-gray-400">
            StructuraCalc is designed to help engineers and students perform moment distribution calculations effortlessly.
            With an intuitive interface and accurate results, we aim to make structural analysis more accessible.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
