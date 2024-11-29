import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Prediction.css";

const Prediction = () => {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    const fetchPredictions = async () => {
      const email = localStorage.getItem("userEmail"); 
      try {
        const response = await axios.get("http://localhost:8000/predictions", {
          params: { email },
        });
        setPredictions(response.data.predictions);
      } catch (error) {
        console.error("Error fetching predictions:", error);
      }
    };
  
    fetchPredictions();
  }, []);  

  const handleConfirm = async (txnId, currentStatus) => {
    const newStatus = currentStatus === 0 ? 1 : 0; 
    try {
      await axios.put(`http://localhost:8000/predictions/${txnId}`, {
        is_Fraud: newStatus,
      });
      setPredictions((prev) =>
        prev.map((pred) =>
          pred.Txn_ID === txnId ? { ...pred, Is_Fraud: newStatus } : pred
        )
      );
    } catch (error) {
      console.error("Error updating confirmation:", error);
      alert("Failed to update confirmation status. Please try again.");
    }
  };
  
  return (
    <div className="prediction-container">
      <h2>Predictions</h2>
      <table className="prediction-table">
        <thead>
          <tr>
            <th>Txn Amount</th>
            <th>Txn Date</th>
            <th>Txn Time</th>
            <th>Txn Location</th>
            <th>Txn Type</th>
            <th>Current Balance</th>
            <th>New Balance</th>
            <th>Receiver Location</th>
            <th>Receiver Category</th>
            <th>Our Flag</th>
            <th>Confirm</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((pred) => (
            <tr key={pred.Txn_ID}>
              <td>{pred.Txn_Amount}</td>
              <td>{pred.Txn_Date}</td>
              <td>{pred.Txn_Time}</td>
              <td>{pred.Txn_Loc}</td>
              <td>{pred.Txn_Type}</td>
              <td>{pred.Account_Balance_Before}</td>
              <td>{pred.Account_Balance_After}</td>
              <td>{pred.Rcvr_Loc}</td>
              <td>{pred.Rcvr_Cat}</td>
              <td>{pred.Is_Flagged === 0 ? "Not Fraud" : "Fraud"}</td>
              <td>
                <button className={`confirm-btn ${pred.Is_Fraud ? "confirmed" : "unconfirmed"}`} onClick={() => handleConfirm(pred.Txn_ID, pred.Is_Fraud)}>
                  {pred.Is_Fraud ? "Fraud" : "Not Fraud"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Prediction;
