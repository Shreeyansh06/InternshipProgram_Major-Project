# Data_Processing.py

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
os.makedirs("outputs", exist_ok=True)

from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix,
    roc_auc_score, roc_curve, auc
)

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

from imblearn.over_sampling import SMOTE

# 1. Load Dataset
# Take dataset from user
file_path = input("Enter dataset file path: ")

df = pd.read_csv(file_path)

print("Dataset loaded successfully!\n")

# 2. Data Cleaning
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df.dropna(inplace=True)

# Store important columns BEFORE dropping
customer_ids = df['customerID']
monthly_charges = df['MonthlyCharges']

# Drop ID column AFTER storing
df.drop('customerID', axis=1, inplace=True)

# 3. Feature Engineering
df['AvgMonthlySpend'] = df['TotalCharges'] / (df['tenure'] + 1)
df['ContractValue'] = df['MonthlyCharges'] * df['tenure']

monthly_charges = df['MonthlyCharges']

# 4. Encoding
df = pd.get_dummies(df, drop_first=True)

# 5. Split Features and Target
target_col = [col for col in df.columns if 'Churn' in col][-1]

X = df.drop(target_col, axis=1)
y = df[target_col]

# 6. Handle Class Imbalance (SMOTE)
smote = SMOTE(random_state=42)
X, y = smote.fit_resample(X, y)

# 7. Train / Validation / Test Split (70-15-15)
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=42
)

# 8. Feature Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Optional MinMaxScaler
minmax = MinMaxScaler()
X_train_mm = minmax.fit_transform(X_train)
X_test_mm = minmax.transform(X_test)

# 9. Models with GridSearchCV
param_grids = {
    "Logistic Regression": {
        "model": LogisticRegression(max_iter=1000),
        "params": {"C": [0.1, 1, 10]}
    },
    "Decision Tree": {
        "model": DecisionTreeClassifier(),
        "params": {"max_depth": [5, 10, None]}
    },
    "Random Forest": {
        "model": RandomForestClassifier(),
        "params": {"n_estimators": [50, 100], "max_depth": [5, 10]}
    },
    "SVM": {
        "model": SVC(probability=True),
        "params": {"C": [0.1, 1], "kernel": ["linear", "rbf"]}
    },
    "KNN": {
        "model": KNeighborsClassifier(),
        "params": {"n_neighbors": [3, 5, 7]}
    }
}

best_models = {}
results = []

# 10. Training + Evaluation
for name, config in param_grids.items():
    print(f"\nTraining {name}...")

    grid = GridSearchCV(
        config["model"],
        config["params"],
        cv=3,
        scoring="roc_auc"
    )

    grid.fit(X_train_scaled, y_train)

    best_model = grid.best_estimator_
    best_models[name] = best_model

    print("Best Parameters:", grid.best_params_)

    # Predictions
    y_pred = best_model.predict(X_test_scaled)
    y_prob = best_model.predict_proba(X_test_scaled)[:, 1]

    # Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc = roc_auc_score(y_test, y_prob)

    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    # Confusion Matrix Heatmap
    cm = confusion_matrix(y_test, y_pred)
    plt.figure()
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title(f"{name} Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.savefig(f"outputs/{name}_confusion_matrix.png")
    plt.show()

    # Store results
    results.append([name, acc, prec, rec, f1, roc])

# Create result table (IMPORTANT) - uses last model's predictions
X_test_df = pd.DataFrame(X_test_scaled, columns=X.columns)

churn_results_df = pd.DataFrame({
    "Actual": y_test.values,
    "Predicted": y_pred,
    "MonthlyCharges": X_test["MonthlyCharges"].values
})
# Filter churn customers
churn_customers = churn_results_df[churn_results_df["Predicted"] == 1]

# Save churn customers list
churn_customers.to_csv(f"outputs/{name}_churn_customers.csv", index=False)

# Revenue impact
total_revenue_loss = churn_customers["MonthlyCharges"].sum()

print("\n===== BUSINESS INSIGHTS =====")

print(f"Total Customers Likely to Churn: {len(churn_customers)}")
print(f"Estimated Revenue Loss: {total_revenue_loss}")

high_risk = churn_customers.sort_values(by="MonthlyCharges", ascending=False)

print("\nTop High-Value Customers at Risk:\n")
print(high_risk.head(5))

# 11. Comparison Table
results_df = pd.DataFrame(
    results,
    columns=["Model", "Accuracy", "Precision", "Recall", "F1", "ROC-AUC"]
)

print("\nModel Comparison:")
print(results_df)

# 12. ROC Curve Plot
plt.figure()

for name, model in best_models.items():
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    roc_auc = auc(fpr, tpr)

    plt.plot(fpr, tpr, label=f"{name} (AUC = {roc_auc:.2f})")

plt.plot([0, 1], [0, 1], linestyle='--')
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve Comparison")
plt.legend()
plt.savefig("outputs/roc_curve.png")
plt.show()

# 13. Feature Importance (Random Forest)
rf_model = best_models["Random Forest"]

importances = pd.Series(
    rf_model.feature_importances_,
    index=X.columns
).sort_values(ascending=False)

plt.figure(figsize=(10, 5))
importances.head(10).plot(kind='bar')
plt.title("Top 10 Important Features")
plt.show()


# 14. SHAP Explainability
import shap


shap.initjs()

# Use Random Forest (best for feature importance + SHAP)
rf_model = best_models["Random Forest"]

# Create SHAP explainer
explainer = shap.TreeExplainer(rf_model)

# Convert scaled data back to DataFrame (for feature names)
X_test_df = pd.DataFrame(X_test_scaled, columns=X.columns)

# Calculate SHAP values
shap_values = explainer.shap_values(X_test_df)

# 15. SHAP Summary Plot
plt.title("SHAP Summary Plot (Feature Impact)")
shap.summary_plot(shap_values[1], X_test_df)
plt.savefig("outputs/shap_summary.png")

# 16. SHAP Feature Importance Plot
plt.title("SHAP Feature Importance")
shap.summary_plot(shap_values[1], X_test_df, plot_type="bar")
plt.savefig("outputs/shap_feature_importance.png")

# 17. SHAP Force Plot (Single Prediction)
shap.force_plot(
    explainer.expected_value[1],
    shap_values[1][0],
    X_test_df.iloc[0]
)