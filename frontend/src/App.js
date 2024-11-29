import React from "react";
import { BrowserRouter as Router, Route, Routes} from "react-router-dom";

import Home from "./components/Home";
import MyTransactions from "./components/MyTransactions";
import NextSteps from "./components/NextSteps";
import SignIn from "./components/SignIn";
import MyAccount from "./components/MyAccount";
import Prediction from "./components/Prediction";

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/my-transactions' element={<MyTransactions />} />
        <Route path='/next-steps' element={<NextSteps />} />
        <Route path='/fraud-in-me' element={<Prediction />} />
        <Route path='/my-account' element={<MyAccount />} />
        <Route path='/welcome' element={<SignIn />} />
      </Routes>
    </Router>
  );
}

export default App;