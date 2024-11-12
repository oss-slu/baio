import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from "react-router-dom";
import ForgotPassword from "../Components/ForgotPassword/ForgotPassword";

global.fetch = jest.fn();

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it("renders the Forgot Password form", () => {
    render(
      <Router>
        <ForgotPassword />
      </Router>
    );
    expect(screen.getByText("Forgot Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("SEND EMAIL")).toBeInTheDocument();
  });

  it("updates email state on input change", () => {
    render(
      <Router>
        <ForgotPassword />
      </Router>
    );
    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
  });

  it("displays success message when email is sent successfully", async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ message: "Password reset email sent" }),
    });

    render(
      <Router>
        <ForgotPassword />
      </Router>
    );
    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByText("SEND EMAIL");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    const successMessage = await screen.findByText("Password reset email sent");
    expect(successMessage).toBeInTheDocument();
  });

  it("displays error message when email is not found", async () => {
    fetch.mockResolvedValueOnce({
      status: 404,
      json: async () => ({ message: "Email not found" }),
    });

    render(
      <Router>
        <ForgotPassword />
      </Router>
    );
    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByText("SEND EMAIL");

    fireEvent.change(emailInput, { target: { value: "unknown@example.com" } });
    fireEvent.click(submitButton);

    const errorMessage = await screen.findByText("Email not found");
    expect(errorMessage).toBeInTheDocument();
  });

  it("displays error message when token is expired", async () => {
    fetch.mockResolvedValueOnce({
      status: 400,
      json: async () => ({ message: "Token expired. Please request a new password reset link." }),
    });

    render(
      <Router>
        <ForgotPassword />
      </Router>
    );
    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByText("SEND EMAIL");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    const expiredTokenMessage = await screen.findByText("Token expired. Please request a new password reset link.");
    expect(expiredTokenMessage).toBeInTheDocument();
  });

  it("navigates to the login page when 'Login' link is clicked", () => {
    render(
      <Router>
        <ForgotPassword />
      </Router>
    );

    const loginLink = screen.getByText("Already have an account? Login");
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");

    fireEvent.click(loginLink);
  });

  it("navigates to the signup page when 'Sign up' link is clicked", () => {
    render(
      <Router>
        <ForgotPassword />
      </Router>
    );

    const signUpLink = screen.getByText("Need a new account? Sign up");
    expect(signUpLink.closest("a")).toHaveAttribute("href", "/signup");

    fireEvent.click(signUpLink);
  });
});
