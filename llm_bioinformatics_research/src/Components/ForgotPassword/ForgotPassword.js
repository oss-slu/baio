import React, { useState } from "react";
import "./ForgotPassword.css";
import config from '../../config.json';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const port = config.port;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`http://localhost:${port}/forgot_password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setMessage(data.message); // Display success message
      } else {
        setError(data.message || "Email not found"); // Display error message if email not found
      }
    } catch (error) {
      console.error("Error sending password reset request:", error);
      setError("An error occurred while sending the password reset request. Please try again.");
    }
  };

  return (
    <div className="container">
      <h2 className="heading">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          required
        />
        <button type="submit" className="button">Send email</button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <p className="signUpText">
        Need a new account? <a href="/signup" className="signUpLink">Sign up</a>
      </p>
      <p className="loginText">
        Already have an account? <a href="/login" className="loginLink">Login</a>
      </p>
    </div>
  );
}

export default ForgotPassword;