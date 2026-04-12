# 1. Import Libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 2. Load Dataset
# Take input from user
file_path = input("Enter dataset file path: ")

# Load dataset
df = pd.read_csv(file_path)

print("Dataset loaded successfully!\n")

# 3. Dataset Overview
print("\nDataset Info:")
print(df.info())

print("\nStatistical Summary:")
print(df.describe())

# 4. Handle Missing Values
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df.dropna(inplace=True)

print("\nMissing Values After Cleaning:")
print(df.isnull().sum())

# 5. Outlier Treatment using IQR (IMPORTANT ADDITION)
Q1 = df['MonthlyCharges'].quantile(0.25)
Q3 = df['MonthlyCharges'].quantile(0.75)
IQR = Q3 - Q1

df = df[(df['MonthlyCharges'] >= Q1 - 1.5 * IQR) &
        (df['MonthlyCharges'] <= Q3 + 1.5 * IQR)]

# 6. Churn Distribution
plt.figure()
sns.countplot(x='Churn', data=df)
plt.title("Churn Distribution")
plt.show()

# Class imbalance check
print("\nChurn Distribution (%):")
print(df['Churn'].value_counts(normalize=True) * 100)

# 7. Numerical Feature Distribution
df.hist(figsize=(12, 10))
plt.suptitle("Histograms of Numerical Features")
plt.show()

# 8. Boxplot
plt.figure()
sns.boxplot(x=df['MonthlyCharges'])
plt.title("Boxplot of Monthly Charges")
plt.show()

# 9. Bivariate Analysis (Expanded)
sns.boxplot(x='Churn', y='MonthlyCharges', data=df)
plt.title("Churn vs Monthly Charges")
plt.show()

sns.boxplot(x='Churn', y='tenure', data=df)
plt.title("Churn vs Tenure")
plt.show()

sns.countplot(x='Contract', hue='Churn', data=df)
plt.title("Contract vs Churn")
plt.xticks(rotation=45)
plt.show()

sns.countplot(x='InternetService', hue='Churn', data=df)
plt.title("Internet Service vs Churn")
plt.show()

sns.countplot(x='PaymentMethod', hue='Churn', data=df)
plt.title("Payment Method vs Churn")
plt.xticks(rotation=45)
plt.show()

# 10. Correlation Heatmap
df_encoded = pd.get_dummies(df, drop_first=True)
corr = df_encoded.corr()

plt.figure(figsize=(12, 10))
sns.heatmap(corr, cmap='coolwarm')
plt.title("Correlation Heatmap")
plt.show()

# 11. Business Insights (Improved)
print("\nBusiness Insights:")
print("1. Month-to-month contract customers churn the most.")
print("2. Customers with higher monthly charges have higher churn probability.")
print("3. Customers with low tenure are more likely to churn.")
print("4. Fiber optic users tend to churn more.")
print("5. Electronic payment users show higher churn behavior.")