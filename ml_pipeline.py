"""
ml_pipeline.py
Refactored version of Data_Processing.py as a callable function.
Returns structured results dict for the Flask API.
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend — must be set before pyplot import
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, roc_curve, auc, confusion_matrix
)
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from imblearn.over_sampling import SMOTE


MODEL_ABBREVS = {
    "Logistic Regression": "Log.Reg.",
    "Decision Tree": "Dec.Tree",
    "Random Forest": "Rand.Forest",
    "SVM": "SVM",
    "KNN": "KNN",
}


def run_pipeline(file_path: str, output_dir: str = "outputs") -> dict:
    os.makedirs(output_dir, exist_ok=True)

    # 1. Load
    df = pd.read_csv(file_path)

    # 2. Clean
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
    df.dropna(inplace=True)

    # Drop ID column if present
    if 'customerID' in df.columns:
        df.drop('customerID', axis=1, inplace=True)

    # 3. Feature Engineering
    df['AvgMonthlySpend'] = df['TotalCharges'] / (df['tenure'] + 1)
    df['ContractValue'] = df['MonthlyCharges'] * df['tenure']

    # 4. Encode
    df = pd.get_dummies(df, drop_first=True)

    # 5. Split features / target
    target_col = [col for col in df.columns if 'Churn' in col][-1]
    X = df.drop(target_col, axis=1)
    y = df[target_col]

    # 6. SMOTE
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X, y)

    # 7. Train / val / test split (70-15-15)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X_resampled, y_resampled, test_size=0.3, random_state=42, stratify=y_resampled
    )
    _, X_test, _, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42
    )

    # 8. Scale
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_test_df = pd.DataFrame(X_test_scaled, columns=X.columns)

    # 9. Models
    param_grids = {
        "Logistic Regression": {
            "model": LogisticRegression(max_iter=1000),
            "params": {"C": [0.1, 1, 10]},
        },
        "Decision Tree": {
            "model": DecisionTreeClassifier(),
            "params": {"max_depth": [5, 10, None]},
        },
        "Random Forest": {
            "model": RandomForestClassifier(),
            "params": {"n_estimators": [50, 100], "max_depth": [5, 10]},
        },
        "SVM": {
            "model": SVC(probability=True),
            "params": {"C": [0.1, 1], "kernel": ["linear", "rbf"]},
        },
        "KNN": {
            "model": KNeighborsClassifier(),
            "params": {"n_neighbors": [3, 5, 7]},
        },
    }

    best_models = {}
    results = []

    # 10. Train + evaluate
    for name, config in param_grids.items():
        grid = GridSearchCV(config["model"], config["params"], cv=3, scoring="roc_auc")
        grid.fit(X_train_scaled, y_train)

        model = grid.best_estimator_
        best_models[name] = model

        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]

        acc  = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec  = recall_score(y_test, y_pred, zero_division=0)
        f1   = f1_score(y_test, y_pred, zero_division=0)
        roc  = roc_auc_score(y_test, y_prob)

        # Confusion matrix image
        cm = confusion_matrix(y_test, y_pred)
        plt.figure()
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title(f"{name} Confusion Matrix")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        safe_name = name.replace(' ', '_')
        plt.savefig(f"{output_dir}/{safe_name}_confusion_matrix.png", bbox_inches='tight')
        plt.close()

        results.append({
            "model":     name,
            "accuracy":  round(acc,  4),
            "precision": round(prec, 4),
            "recall":    round(rec,  4),
            "f1":        round(f1,   4),
            "roc_auc":   round(roc,  4),
        })

    # ROC curve comparison image
    plt.figure()
    for name, model in best_models.items():
        fpr, tpr, _ = roc_curve(y_test, model.predict_proba(X_test_scaled)[:, 1])
        plt.plot(fpr, tpr, label=f"{name} (AUC={auc(fpr, tpr):.2f})")
    plt.plot([0, 1], [0, 1], linestyle='--', color='gray')
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve Comparison")
    plt.legend(fontsize=8)
    plt.savefig(f"{output_dir}/roc_curve.png", bbox_inches='tight')
    plt.close()

    # Best model by ROC-AUC
    best_result     = max(results, key=lambda r: r["roc_auc"])
    best_model_name = best_result["model"]
    best_model      = best_models[best_model_name]

    y_pred_best = best_model.predict(X_test_scaled)
    y_prob_best = best_model.predict_proba(X_test_scaled)[:, 1]

    # Confusion matrix values for best model
    cm_best = confusion_matrix(y_test, y_pred_best)
    tn, fp, fn, tp = cm_best.ravel()

    # Build predictions DataFrame (aligned index 0..n-1)
    churn_predictions = pd.DataFrame({
        "actual":          y_test.values,
        "predicted":       y_pred_best,
        "churn_prob":      y_prob_best,
        "monthly_charges": X_test["MonthlyCharges"].values,
    })

    # Feature importance from Random Forest
    rf_model    = best_models["Random Forest"]
    importances = (
        pd.Series(rf_model.feature_importances_, index=X.columns)
        .sort_values(ascending=False)
        .head(10)
    )
    feature_importance = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in importances.items()
    ]

    # SHAP analysis
    import shap
    explainer   = shap.TreeExplainer(rf_model)
    shap_values = explainer.shap_values(X_test_df)

    # SHAP 0.42+ may return a 3D array (n_samples, n_features, n_classes)
    # instead of the old list-of-arrays format [class0, class1].
    # Normalise to always have shap_class1 with shape (n_samples, n_features).
    if isinstance(shap_values, list):
        # Old format: [neg_class_array, pos_class_array]
        shap_class1 = shap_values[1]
    elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
        # New format: (n_samples, n_features, n_classes)
        shap_class1 = shap_values[:, :, 1]
    else:
        # Single-output fallback
        shap_class1 = shap_values

    # SHAP summary plot
    shap.summary_plot(shap_class1, X_test_df, show=False)
    plt.savefig(f"{output_dir}/shap_summary.png", bbox_inches='tight')
    plt.close()

    # Top at-risk customer SHAP analysis
    top_idx      = int(np.argmax(y_prob_best))
    top_shap_row = shap_class1[top_idx]
    top_feat_vals = X_test_df.iloc[top_idx].values

    shap_items = sorted(
        zip(X.columns.tolist(), top_shap_row, top_feat_vals),
        key=lambda x: abs(x[1]),
        reverse=True,
    )[:6]

    top_customer_shap = [
        {
            "feature":       feat,
            "value":         round(float(sv), 4),
            "feature_value": round(float(fv), 4),
            "description":   f"{'Increases' if sv > 0 else 'Decreases'} churn risk",
        }
        for feat, sv, fv in shap_items
    ]

    # Customer risk segmentation (based on best-model churn probabilities)
    high_risk   = int((y_prob_best > 0.7).sum())
    medium_risk = int(((y_prob_best > 0.4) & (y_prob_best <= 0.7)).sum())
    low_risk    = int((y_prob_best <= 0.4).sum())

    customer_segments = [
        {"name": "High Risk",   "value": high_risk,   "color": "#dc2626"},
        {"name": "Medium Risk", "value": medium_risk, "color": "#f59e0b"},
        {"name": "Low Risk",    "value": low_risk,    "color": "#16a34a"},
    ]

    # High-value customers at risk (top 10 predicted churners by monthly charges)
    churn_mask         = churn_predictions["predicted"] == 1
    high_value_churners = (
        churn_predictions[churn_mask]
        .sort_values("monthly_charges", ascending=False)
        .head(10)
    )

    high_value_customers = []
    for i, (pos, row) in enumerate(high_value_churners.iterrows()):
        # Use SHAP to identify top risk factor for this customer
        customer_shap   = shap_class1[pos]
        top_feat_idx    = int(np.argmax(np.abs(customer_shap)))
        top_feat_name   = X.columns[top_feat_idx]
        high_value_customers.append({
            "id":             f"C{10000 + i}",
            "monthly_revenue": round(float(row["monthly_charges"]), 2),
            "churn_prob":      round(float(row["churn_prob"]), 2),
            "risk_factors":    f"Key driver: {top_feat_name}",
        })

    # Revenue metrics
    churners_df      = churn_predictions[churn_mask]
    total_monthly    = float(churners_df["monthly_charges"].sum())
    avg_monthly      = float(churners_df["monthly_charges"].mean()) if len(churners_df) > 0 else 0.0

    revenue_metrics = {
        "estimated_revenue_loss":  round(total_monthly * 12 / 1000, 1),
        "total_likely_churn":      int(churn_mask.sum()),
        "avg_revenue_per_customer": round(avg_monthly, 0),
        "high_value_at_risk":      len(high_value_customers),
    }

    # Model comparison chart data (abbreviated names for bar chart)
    model_comparison_chart = [
        {
            "model":    MODEL_ABBREVS.get(r["model"], r["model"]),
            "accuracy": round(r["accuracy"] * 100, 1),
            "roc_auc":  round(r["roc_auc"]  * 100, 1),
        }
        for r in results
    ]

    return {
        "model_results":          results,
        "best_model_name":        best_model_name,
        "confusion_matrix":       {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "feature_importance":     feature_importance,
        "customer_segments":      customer_segments,
        "high_value_customers":   high_value_customers,
        "revenue_metrics":        revenue_metrics,
        "top_customer_analysis":  {
            "id":             f"C{10000 + top_idx}",
            "monthly_revenue": round(float(churn_predictions.iloc[top_idx]["monthly_charges"]), 2),
            "churn_prob":      round(float(y_prob_best[top_idx]), 2),
            "shap_values":     top_customer_shap,
        },
        "model_comparison_chart": model_comparison_chart,
    }
