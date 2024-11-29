import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "./SignIn.css";

const SignIn = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ Email: '', Password: '' });
  const [formData, setFormData] = useState({
    First_Name: '',
    Middle_Name: '',
    Last_Name: '',
    Email: '',
    Phone: '',
    Password: '',
    Acc_No: '',
    Bank_Name: '',
    Acc_Type: 'Savings',
    Balance: '0.00',
    Open_Date: '',
    Is_Active: true,
  });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/user/login', loginData);
      alert('Login data posted successfully!');
      localStorage.setItem("userEmail", loginData.Email);

      navigate('/my-account');

    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to post login data. Please try again.');
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/user/signup', formData);
      alert('new user added successfully! you can log in now.');
      window.location.reload();
    } catch (error) {
      console.error('Signup failed:', error);
      alert('Failed to post signup data. Please try again.');
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };
  return (
    <div className="total">
      <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
      <div className="auth-container">
        <button onClick={toggleAuthMode}>
          {isLogin ? 'Switch to Sign Up' : 'Switch to Log In'}
        </button>
        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <label>Email:</label>
            <input type="email" name="Email" placeholder="Email" value={loginData.Email} onChange={handleLoginChange} required/>
            <label>Password:</label>
            <input type="password" name="Password" placeholder="Password" value={loginData.Password} onChange={handleLoginChange} required/>
            <button type="submit">Log In</button>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit}>
            <label>Name:</label>
            <div className="row">
              <input type="text" name="First_Name" placeholder="First Name" value={formData.First_Name} onChange={handleFormChange} required/>
              <input type="text" name="Middle_Name" placeholder="Middle Name" value={formData.Middle_Name} onChange={handleFormChange}/>
              <input type="text" name="Last_Name" placeholder="Last Name" value={formData.Last_Name} onChange={handleFormChange} required/>
            </div>
            
            <label>Email and Phone:</label>
            <div className="row">
              <input type="email" name="Email" placeholder="Email" value={formData.Email} onChange={handleFormChange} required/>
              <input type="tel" name="Phone" placeholder="Phone" value={formData.Phone} onChange={handleFormChange} required/>
            </div>
            
            <label>Bank Details:</label>
            <input type="text" name="Bank_Name" placeholder="Bank Name" value={formData.Bank_Name} onChange={handleFormChange} required/>
            <input type="text" name="Acc_No" placeholder="Account Number" value={formData.Acc_No} onChange={handleFormChange} required/>
            
            <label>Account Type:</label>
            <select
              name="Acc_Type" value={formData.Acc_Type} onChange={handleFormChange} required>
              <option value="Checking">Checking</option>
              <option value="Joint">Joint</option>
              <option value="Salary">Salary</option>
              <option value="Savings">Savings</option>
              <option value="Zero Balance">Zero Balance</option>
            </select>
            
            <label>Account Open Date:</label>
            <input type="date" name="Open_Date" value={formData.Open_Date} onChange={handleFormChange} required />
            
            <label>Initial Balance:</label>
            <input type="number" name="Balance" value={formData.Balance} onChange={handleFormChange} required/>
            
            <label>Password:</label>
            <input type="password" name="Password" placeholder="Password" value={formData.Password} onChange={handleFormChange} required/>
            <button type="submit">Sign Up</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignIn;
