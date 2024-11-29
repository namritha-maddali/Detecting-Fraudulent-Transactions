import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import "./MyAccount.css";

const MyAccount = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUserInfo, setUpdatedUserInfo] = useState({});

  const navigate = useNavigate();
  const goToMyTransactions = () => {
    navigate('/my-transactions');
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        // console.log("Fetched email from localStorage:", email);
        if (!email) throw new Error("User email not found. Please log in again.");
        
        const response = await axios.get(`http://localhost:8000/user/details`, {
          params: { email }, // authentication
        });
        
        setUserInfo(response.data.user);
        setUpdatedUserInfo(response.data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to fetch user data. Please log in again.");
      }
    };

    fetchUserInfo();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUserInfo((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `http://localhost:8000/user/update/${userInfo.User_ID}`, updatedUserInfo);
      setUserInfo(updatedUserInfo);
      alert("User Information Updated Successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving user data:", error);
      alert("Failed to update user information. Please try again.");
    }
  };
  

  const handleCancel = () => {
    setUpdatedUserInfo(userInfo);
    setIsEditing(false); 
  };

  
  const toggleStatus = () => {
    setUpdatedUserInfo((prevState) => ({
      ...prevState,
      Is_Active: !prevState.Is_Active,
    }));
  };
  
  if (!userInfo) return <p>Loading...</p>;

  return (
    <div className="account-container">
      <h2>My Account</h2>
      <div className="account-details-container">
        <div className="info">
          <strong>Name:</strong>
          {isEditing ? (
            <>
              <input type="text" name="First_Name" value={updatedUserInfo.First_Name || ""} onChange={handleChange}/>
              <input type="text" name="Middle_Name" value={updatedUserInfo.Middle_Name || ""} onChange={handleChange}/>
              <input type="text" name="Last_Name" value={updatedUserInfo.Last_Name || ""} onChange={handleChange}/>
            </>
          ) : (
            <span>
              {userInfo.First_Name} {userInfo.Middle_Name} {userInfo.Last_Name}
            </span>
          )}
        </div>

        <div className="info">
          <strong>Email:</strong>
          <input type="email" name="Email" value={updatedUserInfo.Email || ""} onChange={handleChange} disabled={!isEditing}/>
        </div>

        <div className="info">
          <strong>Phone:</strong>
          <input type="tel" name="Phone" value={updatedUserInfo.Phone || ""} onChange={handleChange} disabled={!isEditing}/>
        </div>

        <div className="info">
          <strong>Bank Name:</strong>
          <input type="text" name="Bank_Name" value={updatedUserInfo.Bank_Name || ""} onChange={handleChange} disabled={!isEditing}/>
        </div>

        <div className="info">
          <strong>Account Number:</strong>
          <input type="text" name="Acc_No" value={updatedUserInfo.Acc_No || ""} onChange={handleChange} disabled={!isEditing}/>
        </div>

        <div className="info">
          <strong>Account Type:</strong>
          <select name="Acc_Type" value={updatedUserInfo.Acc_Type || ""} onChange={handleChange} disabled={!isEditing}>
            <option value="Checking">Checking</option>
            <option value="Joint">Joint</option>
            <option value="Salary">Salary</option>
            <option value="Savings">Savings</option>
            <option value="Zero Balance">Zero Balance</option>
          </select>
        </div>

        <div className="info">
          <strong>Intial Balance:</strong>
          <input type="number" name="Balance" value={updatedUserInfo.Balance || 0} onChange={handleChange} disabled={!isEditing}/>
        </div>

        <div className="info">
          <strong>Open Date:</strong>
          <input type="date" name="Open_Date" value={updatedUserInfo.Open_Date || ""} onChange={handleChange} disabled={!isEditing}/>
        </div>

        <div className="info">
          <strong>Password:</strong>
          <input type="text" name="Password" value={updatedUserInfo.Password || ""} onChange={handleChange} disabled={!isEditing}/>
        </div>

        <div className="info">
          <strong>Status:</strong>
          <button className={updatedUserInfo.Is_Active ? "status-active" : "status-inactive"} onClick={toggleStatus}>
            {updatedUserInfo.Is_Active ? "Active" : "Inactive"}
          </button>
        </div>

        <div className="button-container">
          {isEditing ? (
            <>
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)}>Edit</button>
              <button onClick={goToMyTransactions}> My Transactions </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
