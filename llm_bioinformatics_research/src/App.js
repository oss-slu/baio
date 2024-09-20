import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LoginScreen from './LoginScreen/LoginScreen';
import HomeScreen from './HomeScreen/HomeScreen';  // Import HomeScreen

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/home" element={<HomeScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
