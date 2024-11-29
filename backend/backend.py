from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import model_predict

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password="password",
    database="fraudulent_transactions"
)
cursor = connection.cursor()

session_state = {}

def new_user(user_info):
    try:
        user_query = """
        INSERT INTO User (First_Name, Middle_Name, Last_Name, Email, Phone, Password)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        user_values = (
            user_info["First_Name"],
            user_info["Middle_Name"],
            user_info["Last_Name"],
            user_info["Email"],
            user_info["Phone"],
            user_info["Password"],
        )
        cursor.execute(user_query, user_values)
        connection.commit()
        user_id = cursor.lastrowid

        account_query = """
        INSERT INTO Bank_Account (Acc_No, Bank_Name, Acc_Type, Balance, Open_Date, Is_Active, User_ID)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        account_values = (
            user_info["Acc_No"],
            user_info["Bank_Name"],
            user_info["Acc_Type"],
            user_info["Balance"],
            user_info["Open_Date"],
            user_info["Is_Active"],
            user_id,
        )
        cursor.execute(account_query, account_values)
        connection.commit()
    except mysql.connector.Error as err:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(err))


def get_user(email, password):
    cursor.execute("""
        SELECT 
            User.User_ID, User.First_Name, User.Middle_Name, User.Last_Name, 
            User.Email, User.Phone, User.Password, Bank_Account.Acc_No, Bank_Account.Bank_Name, 
            Bank_Account.Acc_Type, Bank_Account.Balance, Bank_Account.Open_Date, 
            Bank_Account.Is_Active
        FROM User
        JOIN Bank_Account ON User.User_ID = Bank_Account.User_ID
        WHERE User.Email = %s AND User.Password = %s
    """, (email, password))
    return cursor.fetchone()


# for signup and login page 
@app.post("/user/signup")
async def sign_up(user_info: dict):
    try:
        new_user(user_info)
        return {"message": "User signed up successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/login")
async def log_in(user_info: dict):
    try:
        email = user_info.get("Email")
        password = user_info.get("Password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and Password are required")

        user = get_user(email, password)
        if user:
            data = {
                    "User_ID": user[0],
                    "First_Name": user[1],
                    "Middle_Name": user[2],
                    "Last_Name": user[3],
                    "Email": user[4],
                    "Phone": user[5],
                    "Password": user[6],
                    "Acc_No": user[7],
                    "Bank_Name": user[8],
                    "Acc_Type": user[9],
                    "Balance": user[10],
                    "Open_Date": user[11],
                    "Is_Active": user[12],
                }
            session_state[email] = data
            return {"user": data}
        else:
            raise HTTPException(status_code=404, detail="Invalid email or password")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# for my-account page
@app.get("/user/details")
async def get_user_details(email: str = None):
    try:
        if not email or email not in session_state:
            raise HTTPException(status_code=404, detail="User not logged in")
        return {"user": session_state[email]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# for editing my-account
@app.put("/user/update/{user_id}")
async def update_user_info(user_id: int, user_info: dict):
    try:
        cursor.callproc('UpdateUserInfo', [
            user_id, 
            user_info.get("First_Name"), 
            user_info.get("Middle_Name"), 
            user_info.get("Last_Name"), 
            user_info.get("Email"), 
            user_info.get("Phone"),
            user_info.get("Password"),
            user_info.get("Acc_No"), 
            user_info.get("Bank_Name"), 
            user_info.get("Acc_Type"), 
            user_info.get("Balance"), 
            user_info.get("Open_Date"), 
            user_info.get("Is_Active")
        ])
        connection.commit()

        for email, cached_user in session_state.items():
            if cached_user["User_ID"] == user_id:
                session_state[email].update(user_info)
                break

        return {"message": "User information updated successfully!"}
    except mysql.connector.Error as err:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# for transactions page
def insert_transaction(transaction_data):
    try:
        cursor.execute("SELECT User_ID FROM User WHERE Email = %s", (transaction_data["email"],))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user[0]

        txn_query = """
        INSERT INTO Transaction (Txn_Date, Txn_Time, Txn_Loc, Txn_Amount, Txn_Type, 
        Account_Balance_Before, Account_Balance_After, Rcvr_Loc, Rcvr_Cat, User_ID)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        txn_values = (
            transaction_data["Txn_Date"],
            transaction_data["Txn_Time"],
            transaction_data["Txn_Loc"],
            float(transaction_data["Txn_Amount"]),
            transaction_data["Txn_Type"],
            float(transaction_data["Account_Balance_Before"]),
            float(transaction_data["Account_Balance_After"]),
            transaction_data["Rcvr_Loc"],
            transaction_data["Rcvr_Cat"],
            user_id,
        )
        cursor.execute(txn_query, txn_values)
        connection.commit()

        cursor.execute("SELECT * FROM Transaction WHERE Txn_ID = LAST_INSERT_ID()")
        return cursor.fetchone()  
    except mysql.connector.Error as err:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {err}")

@app.get("/transactions")
async def get_transactions(email: str = None):
    try:
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        query = """
        SELECT t.Txn_ID, t.Txn_Date, t.Txn_Time, t.Txn_Loc, t.Txn_Amount, 
               t.Txn_Type, t.Account_Balance_Before, t.Account_Balance_After, 
               t.Rcvr_Loc, t.Rcvr_Cat
        FROM Transaction t
        JOIN User u ON t.User_ID = u.User_ID
        WHERE u.Email = %s
        """
        cursor.execute(query, (email,))
        transactions = cursor.fetchall()

        rows = [
            {
                "Txn_ID": txn[0],
                "Txn_Date": txn[1],
                "Txn_Time": txn[2],
                "Txn_Loc": txn[3],
                "Txn_Amount": txn[4],
                "Txn_Type": txn[5],
                "Account_Balance_Before": txn[6],
                "Account_Balance_After": txn[7],
                "Rcvr_Loc": txn[8],
                "Rcvr_Cat": txn[9],
            }
            for txn in transactions
        ]
        return {"transactions": rows}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transactions")
async def add_transaction(transaction_data: dict):
    try:
        new_transaction = insert_transaction(transaction_data)
        return {
            "Txn_ID": new_transaction[0],
            "Txn_Date": new_transaction[1],
            "Txn_Time": new_transaction[2],
            "Txn_Loc": new_transaction[3],
            "Txn_Amount": new_transaction[4],
            "Txn_Type": new_transaction[5],
            "Account_Balance_Before": new_transaction[6],
            "Account_Balance_After": new_transaction[7],
            "Rcvr_Loc": new_transaction[8],
            "Rcvr_Cat": new_transaction[9],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/transactions/{txn_id}")
async def delete_transaction(txn_id: int):
    try:
        cursor.callproc("DeleteTransaction", [txn_id])
        connection.commit()
        return {"message": "Transaction deleted successfully!", "id": txn_id}
    except mysql.connector.Error as err:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    

# for predictions page
def update_predictions():
    query = """
        UPDATE Prediction
        SET Is_Flagged = %s, Is_Fraud = %s
        WHERE Txn_ID = %s
    """
    for txn_id, is_flagged, is_fraud in model_predict.final_data:
        cursor.execute(query, (is_flagged, is_fraud, txn_id))
    connection.commit()


@app.post("/predictions")
async def update_predictions_endpoint():
    try:
        result = update_predictions()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/predictions")
async def get_predictions(email: str = None):
    try:
        if not email or email not in session_state:
            raise HTTPException(status_code=401, detail="Unauthorized or user not logged in")
        
        user_id = session_state[email]["User_ID"]
        cursor.execute("""
        SELECT 
            t.Txn_ID, t.Txn_Date, t.Txn_Time, t.Txn_Loc, t.Txn_Amount, t.Txn_Type, 
            t.Account_Balance_Before, t.Account_Balance_After, t.Rcvr_Loc, t.Rcvr_Cat, 
            p.Is_Flagged, p.Is_Fraud
        FROM Transaction t
        JOIN Prediction p ON t.Txn_ID = p.Txn_ID
        WHERE t.User_ID = %s
        """, (user_id,))

        predictions = cursor.fetchall()
        rows = []
        for pred in predictions:
            rows.append({
                "Txn_ID": pred[0],
                "Txn_Date": pred[1],
                "Txn_Time": pred[2],
                "Txn_Loc": pred[3],
                "Txn_Amount": pred[4],
                "Txn_Type": pred[5],
                "Account_Balance_Before": pred[6],
                "Account_Balance_After": pred[7],
                "Rcvr_Loc": pred[8],
                "Rcvr_Cat": pred[9],
                "Is_Flagged": pred[10],
                "Is_Fraud": pred[11],
            })
        return {"predictions": rows}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/predictions/{txn_id}")
async def update_confirmation(txn_id: int, is_Fraud: bool):
    try:
        cursor.execute("UPDATE Prediction SET Is_Fraud = %s WHERE Txn_ID = %s", (is_Fraud, txn_id))
        connection.commit()
        return {"message": "Confirmation status updated successfully!"}
    except mysql.connector.Error as err:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {err}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000, reload=True)
    # to run:: uvicorn backend:app --reload
