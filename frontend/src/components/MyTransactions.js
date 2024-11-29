import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import "./MyTransactions.css";

const MyTransactions = () => {
  const navigate = useNavigate();
  const goToPrediction = () => {
    navigate('/fraud-in-me');
  };
  
  const txnLocOptions = ["India", "USA", "Russia", "China", "Pakistan", "North Korea"];
  const txnTypeOptions = ["Deposit", "Withdrawal", "Transfer"];
  const rcvrLocOptions = ["India", "USA", "Russia", "China", "Pakistan", "North Korea"];
  const rcvrCatOptions = ["Individual", "Business", "External"];
  
  const [userInfo, setUserInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTransactions, setNewTransactions] = useState([
    {
      Txn_Amount: "",
      Txn_Date: "",
      Txn_Time: "",
      Txn_Loc: txnLocOptions[0],
      Txn_Type: txnTypeOptions[0],
      Account_Balance_Before: "",
      Account_Balance_After: "",
      Rcvr_Loc: rcvrLocOptions[0],
      Rcvr_Cat: rcvrCatOptions[0],
    },
  ]);
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (!userEmail) throw new Error("User email not found. Please log in again.");
        const response = await axios.get(`http://localhost:8000/user/details`, {
          params: { email: userEmail },
        });
        setUserInfo(response.data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to fetch user data. Please log in again.");
      }
    };

    const fetchTransactions = async () => {
      try {
        const response = await axios.get("http://localhost:8000/transactions", {
          params: { email: userEmail },
        });
        const transactionData = response.data.transactions;
        setTransactions(Array.isArray(transactionData) ? transactionData : []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      }
    };

    fetchUserInfo();
    fetchTransactions();
  }, [userEmail]);

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedTransactions = [...newTransactions];
    updatedTransactions[index][name] = value;
    setNewTransactions(updatedTransactions);
  };

  const handleDelete = async (txnId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        const response = await axios.delete(`http://localhost:8000/transactions/${txnId}`);
        alert(response.data.message);
  
        setTransactions(transactions.filter((txn) => txn.Txn_ID !== txnId));
      } catch (error) {
        console.error("Error deleting transaction:", error);
        const errorMessage = error.response?.data?.detail || "Failed to delete the transaction. Please try again.";
        alert(errorMessage);
      }
    }
  }; 
  
  const addNewRow = async () => {
    const currentTransaction = newTransactions[newTransactions.length - 1];
    if (!currentTransaction.Txn_Amount || !currentTransaction.Txn_Date || !currentTransaction.Txn_Time) {
      alert("Please fill in all required fields before adding a new transaction.");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:8000/transactions", {
        ...currentTransaction,
        email: userEmail,
      });
  
      const addedTransaction = response.data;
      setTransactions([...transactions, addedTransaction]);

      setNewTransactions([
        ...newTransactions,
        {
          Txn_Amount: "",
          Txn_Date: "",
          Txn_Time: "",
          Txn_Loc: txnLocOptions[0],
          Txn_Type: txnTypeOptions[0],
          Account_Balance_Before: "",
          Account_Balance_After: "",
          Rcvr_Loc: rcvrLocOptions[0],
          Rcvr_Cat: rcvrCatOptions[0],
        },
      ]);
      window.location.reload();
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to save the transaction. Please try again.");
    }
  };
  
  
  if (!userInfo) return <p>No user info ...</p>;

  return (
    <div className="account-container">
      <h2>My Transactions</h2>
      <div className="your-info">
        <strong>Name:</strong>
        <span> {userInfo.First_Name} {userInfo.Middle_Name} {userInfo.Last_Name} </span>
        <strong>Email:</strong>
        <span>{userInfo.Email}</span>
      </div>
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Trxn Amount</th>
            <th>Trxn Date</th>
            <th>Trxn Time</th>
            <th>Trxn Location</th>
            <th>Trxn Type</th>
            <th>Current Account Balance</th>
            <th>New Account Balance</th>
            <th>Receiver Location</th>
            <th>Receiver Category</th>
            <th> Delete </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={`txn-${index}`}>
              <td>{transaction.Txn_Amount}</td>
              <td>{transaction.Txn_Date}</td>
              <td>{transaction.Txn_Time}</td>
              <td>{transaction.Txn_Loc}</td>
              <td>{transaction.Txn_Type}</td>
              <td>{transaction.Account_Balance_Before}</td>
              <td>{transaction.Account_Balance_After}</td>
              <td>{transaction.Rcvr_Loc}</td>
              <td>{transaction.Rcvr_Cat}</td>
              <td><button className="delete-btn" onClick={() => handleDelete(transaction.Txn_ID)}> Delete </button></td>
            </tr>
          ))}
          {newTransactions.map((transaction, index) => (
            <tr key={`new-txn-${index}`}>
              <td>
                <input type="text" name="Txn_Amount" value={transaction.Txn_Amount} onChange={(e) => handleInputChange(index, e)} placeholder="Amount" required />
              </td>
              <td>
                <input type="date" name="Txn_Date" value={transaction.Txn_Date} onChange={(e) => handleInputChange(index, e)} required />
              </td>
              <td>
                <input type="time" name="Txn_Time" value={transaction.Txn_Time} onChange={(e) => handleInputChange(index, e)} required />
              </td>
              <td>
                <select name="Txn_Loc" value={transaction.Txn_Loc} onChange={(e) => handleInputChange(index, e)} required>
                  {txnLocOptions.map((option, optionIndex) => (
                    <option key={optionIndex} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select name="Txn_Type" value={transaction.Txn_Type} onChange={(e) => handleInputChange(index, e)} required>
                  {txnTypeOptions.map((option, optionIndex) => (
                    <option key={optionIndex} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input type="number" name="Account_Balance_Before" value={transaction.Account_Balance_Before} onChange={(e) => handleInputChange(index, e)} placeholder="Before" required />
              </td>
              <td>
                <input type="number" name="Account_Balance_After" value={transaction.Account_Balance_After} onChange={(e) => handleInputChange(index, e)} placeholder="After" required />
              </td>
              <td>
                <select name="Rcvr_Loc" value={transaction.Rcvr_Loc} onChange={(e) => handleInputChange(index, e)} required>
                  {rcvrLocOptions.map((option, optionIndex) => (
                    <option key={optionIndex} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select name="Rcvr_Cat" value={transaction.Rcvr_Cat} onChange={(e) => handleInputChange(index, e)} required>
                  {rcvrCatOptions.map((option, optionIndex) => (
                    <option key={optionIndex} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="new-transaction" onClick={addNewRow}>
        + New
      </button>

      <button className="to-pred" onClick={goToPrediction}>Am I Safe? T-T</button>
    </div>
  );
};

export default MyTransactions;
