import mysql.connector
import pandas as pd
import pickle, json

with open('scaling.json', 'r') as file:
    scaling = json.load(file)
    file.close()

with open('fraud_detection_model.pkl', 'rb') as file:  
    model = pickle.load(file)
    file.close()

connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password="password",
    database="fraudulent_transactions"
)
cursor = connection.cursor()
cursor.execute('''
    SELECT t.Txn_ID, 
        t.Txn_Loc,  
        t.Txn_Type, 
        ba.Acc_Type,
        t.Account_Balance_Before, 
        t.Account_Balance_After, 
        t.Rcvr_Loc, 
        t.Rcvr_Cat, 
        t.Txn_Date, 
        t.Txn_Time, 
        t.Txn_Amount
    FROM Transaction t
    JOIN Bank_Account ba ON t.User_ID = ba.User_ID;

''')
txns = [entry for entry in cursor.fetchall()]

columns = ['Txn_ID', 'Txn_Loc', 'Txn_Type', 'Acc_Type', 'Account_Balance_Before', 'Account_Balance_After', 'Rcvr_Loc', 'Rcvr_Cat', 'Txn_Date', 'Txn_Time', 'Txn_Amount']
df = pd.DataFrame(txns, columns=columns)
to_be_scaled = df[columns[1:-1]]

country_mapping = {"India": 1, "USA": 2, "Russia": 3, "China": 4, "Pakistan": 5, "North Korea": 6}
txn_mapping = {"Deposit": 1, "Withdrawal": 2, "Transfer": 3}
rcv_mapping = {"Individual": 1, "Business": 2, "External": 3};
acc_mapping = {"Savings": 1, "Zero Balance": 2, "Salary": 3, 'Checking': 4, 'Joint': 5};

to_be_scaled['Txn_Date'] = pd.to_datetime(to_be_scaled['Txn_Date'])
to_be_scaled['Txn_Date'] = to_be_scaled['Txn_Date'].astype(int) / 10**18 

to_be_scaled['Txn_Loc'].replace(country_mapping, inplace=True)
to_be_scaled['Rcvr_Loc'].replace(country_mapping, inplace=True)
to_be_scaled['Txn_Type'].replace(txn_mapping, inplace=True)
to_be_scaled['Rcvr_Cat'].replace(rcv_mapping, inplace=True)
to_be_scaled['Acc_Type'].replace(acc_mapping, inplace=True)

to_be_scaled['Account_Balance_Before'] = to_be_scaled['Account_Balance_Before'].astype(float)
to_be_scaled['Account_Balance_After'] = to_be_scaled['Account_Balance_After'].astype(float)

for col in to_be_scaled.columns:
    if col == "Txn_Time":  # Handle timedelta separately
        to_be_scaled[col] = to_be_scaled[col].dt.total_seconds() / (60*60*24)

    mean = scaling[col]["mean"]
    std = scaling[col]["std"]
    to_be_scaled[col] = (to_be_scaled[col] - mean) / std


features = to_be_scaled
features['Txn_ID'] = df['Txn_ID']
features['Txn_Amount'] = df['Txn_Amount']

features = features.rename(columns={
    'Txn_ID': 'id',
    'Txn_Loc': 'V4',
    'Txn_Type': 'V10',
    'Acc_Type': 'V11',
    'Account_Balance_Before': 'V12',
    'Account_Balance_After': 'V14',
    'Rcvr_Loc': 'V17',
    'Rcvr_Cat': 'V18',
    'Txn_Date': 'V3',
    'Txn_Time': 'V7',
    'Txn_Amount': 'Amount',
})

new = ["id"] + [col for col in features.columns if col != "id"]
features = features[new]

prediction = model.predict(features)

final_data = [
    (int(txn_id), int(is_fraud), int(is_fraud))
    for txn_id, is_fraud in zip(features["id"], prediction)
]