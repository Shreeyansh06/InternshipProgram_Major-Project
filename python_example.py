"""
ML Results Dashboard - Python Data Preparation Example
This file demonstrates how to prepare your ML model outputs for the dashboard UI.
"""

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc
)
import numpy as np
import pandas as pd


class MLResultsDashboard:
    """
    Helper class to prepare ML model results for the dashboard UI.
    Use this to transform your model outputs into the format expected by the HTML templates.
    """

    def __init__(self, y_true, y_pred, y_pred_proba=None, feature_names=None):
        """
        Initialize with model predictions.

        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Predicted probabilities (for ROC curve)
            feature_names: List of feature names
        """
        self.y_true = y_true
        self.y_pred = y_pred
        self.y_pred_proba = y_pred_proba
        self.feature_names = feature_names

    def get_performance_metrics(self):
        """
        Calculate and return model performance metrics.

        Returns:
            dict: Dictionary with accuracy, precision, recall, and F1 score
        """
        return {
            'accuracy': round(accuracy_score(self.y_true, self.y_pred) * 100, 1),
            'precision': round(precision_score(self.y_true, self.y_pred, average='binary') * 100, 1),
            'recall': round(recall_score(self.y_true, self.y_pred, average='binary') * 100, 1),
            'f1_score': round(f1_score(self.y_true, self.y_pred, average='binary') * 100, 1)
        }

    def get_confusion_matrix_dict(self):
        """
        Get confusion matrix values as a dictionary.

        Returns:
            dict: Confusion matrix with labeled keys
        """
        cm = confusion_matrix(self.y_true, self.y_pred)
        return {
            'true_negative': int(cm[0, 0]),
            'false_positive': int(cm[0, 1]),
            'false_negative': int(cm[1, 0]),
            'true_positive': int(cm[1, 1]),
            'total_samples': int(cm.sum())
        }

    def get_roc_data(self):
        """
        Calculate ROC curve data.

        Returns:
            dict: ROC curve data with fpr, tpr, and auc
        """
        if self.y_pred_proba is None:
            raise ValueError("y_pred_proba is required for ROC curve")

        fpr, tpr, thresholds = roc_curve(self.y_true, self.y_pred_proba)
        roc_auc = auc(fpr, tpr)

        return {
            'fpr': fpr.tolist(),
            'tpr': tpr.tolist(),
            'auc': round(roc_auc, 3)
        }

    def get_feature_importance(self, model, top_n=6):
        """
        Get feature importance from a tree-based model.

        Args:
            model: Trained model with feature_importances_ attribute
            top_n: Number of top features to return

        Returns:
            list: List of dicts with feature names and importance values
        """
        if not hasattr(model, 'feature_importances_'):
            raise ValueError("Model does not have feature_importances_ attribute")

        importance = model.feature_importances_

        if self.feature_names is None:
            feature_names = [f'Feature {i}' for i in range(len(importance))]
        else:
            feature_names = self.feature_names

        # Create list of dicts sorted by importance
        feature_importance_list = [
            {
                'name': name,
                'importance': round(float(imp), 2)
            }
            for name, imp in zip(feature_names, importance)
        ]

        # Sort by importance and take top N
        feature_importance_list.sort(key=lambda x: x['importance'], reverse=True)
        return feature_importance_list[:top_n]

    def get_shap_summary(self, shap_values, feature_names=None, top_n=6):
        """
        Prepare SHAP values for the dashboard.

        Args:
            shap_values: SHAP values array (mean absolute values per feature)
            feature_names: List of feature names
            top_n: Number of top features to show

        Returns:
            list: List of dicts with SHAP value information
        """
        if feature_names is None:
            feature_names = self.feature_names or [f'Feature {i}' for i in range(len(shap_values))]

        shap_list = []
        for name, value in zip(feature_names, shap_values):
            shap_list.append({
                'feature': name,
                'value': round(float(value), 2),
                'description': self._get_shap_description(value)
            })

        # Sort by absolute value and take top N
        shap_list.sort(key=lambda x: abs(x['value']), reverse=True)
        return shap_list[:top_n]

    def _get_shap_description(self, value):
        """Generate description based on SHAP value."""
        abs_value = abs(value)
        direction = 'positive' if value > 0 else 'negative'

        if abs_value > 0.3:
            magnitude = 'Strong'
        elif abs_value > 0.15:
            magnitude = 'Moderate'
        else:
            magnitude = 'Weak'

        return f'{magnitude} {direction} contribution to prediction'


class ModelComparison:
    """
    Helper class to compare multiple models.
    """

    def __init__(self):
        self.models = []

    def add_model(self, name, y_true, y_pred, training_time=None):
        """
        Add a model's results to the comparison.

        Args:
            name: Model name
            y_true: True labels
            y_pred: Predicted labels
            training_time: Training time in seconds
        """
        metrics = {
            'name': name,
            'accuracy': round(accuracy_score(y_true, y_pred) * 100, 1),
            'precision': round(precision_score(y_true, y_pred, average='binary') * 100, 1),
            'recall': round(recall_score(y_true, y_pred, average='binary') * 100, 1),
            'f1_score': round(f1_score(y_true, y_pred, average='binary') * 100, 1),
            'training_time': round(training_time, 1) if training_time else None
        }
        self.models.append(metrics)

    def get_comparison_table(self):
        """
        Get all models in a format ready for the comparison table.

        Returns:
            list: List of model dictionaries sorted by accuracy
        """
        return sorted(self.models, key=lambda x: x['accuracy'], reverse=True)


# ============================================================================
# FLASK INTEGRATION EXAMPLE
# ============================================================================

def flask_example():
    """
    Complete Flask application example.
    """

    flask_code = '''
from flask import Flask, render_template
from ml_results_dashboard import MLResultsDashboard, ModelComparison
import joblib

app = Flask(__name__)

# Load your trained model
model = joblib.load('model.pkl')

@app.route('/results')
def show_results():
    # Load your test data and predictions
    # (In real scenario, load from database or model predictions)
    y_true = ...  # Your true labels
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    # Initialize dashboard helper
    dashboard = MLResultsDashboard(
        y_true=y_true,
        y_pred=y_pred,
        y_pred_proba=y_pred_proba,
        feature_names=['Age', 'Income', 'Credit Score', 'Purchase History']
    )

    # Prepare all data for template
    context = {
        'metrics': dashboard.get_performance_metrics(),
        'confusion_matrix': dashboard.get_confusion_matrix_dict(),
        'roc_data': dashboard.get_roc_data(),
        'feature_importance': dashboard.get_feature_importance(model),
        'shap_values': dashboard.get_shap_summary(shap_values),  # Calculate separately
    }

    # Model comparison (if comparing multiple models)
    comparison = ModelComparison()
    comparison.add_model('Random Forest', y_true, y_pred_rf, training_time=2.3)
    comparison.add_model('XGBoost', y_true, y_pred_xgb, training_time=3.7)
    context['models'] = comparison.get_comparison_table()

    return render_template('results.html', **context)

if __name__ == '__main__':
    app.run(debug=True)
'''

    return flask_code


# ============================================================================
# DJANGO INTEGRATION EXAMPLE
# ============================================================================

def django_example():
    """
    Complete Django view example.
    """

    django_code = '''
# views.py
from django.shortcuts import render
from .ml_results_dashboard import MLResultsDashboard, ModelComparison
import joblib

def results_view(request):
    # Load model and data
    model = joblib.load('model.pkl')

    # Get predictions
    y_true = ...  # Your true labels
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    # Initialize dashboard
    dashboard = MLResultsDashboard(
        y_true=y_true,
        y_pred=y_pred,
        y_pred_proba=y_pred_proba,
        feature_names=['Age', 'Income', 'Credit Score']
    )

    # Prepare context
    context = {
        'metrics': dashboard.get_performance_metrics(),
        'confusion_matrix': dashboard.get_confusion_matrix_dict(),
        'feature_importance': dashboard.get_feature_importance(model),
    }

    return render(request, 'results.html', context)
'''

    return django_code


# ============================================================================
# COMPLETE USAGE EXAMPLE
# ============================================================================

if __name__ == '__main__':
    """
    Complete example showing how to use the MLResultsDashboard class.
    """

    # Sample data (replace with your actual data)
    from sklearn.datasets import make_classification

    # Generate sample data
    X, y = make_classification(
        n_samples=8000,
        n_features=6,
        n_informative=4,
        n_redundant=2,
        random_state=42
    )

    feature_names = ['Age', 'Income', 'Credit Score', 'Purchase History', 'Location', 'Device Type']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Get predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    # Initialize dashboard
    dashboard = MLResultsDashboard(
        y_true=y_test,
        y_pred=y_pred,
        y_pred_proba=y_pred_proba,
        feature_names=feature_names
    )

    # Get all metrics for template
    print("=== Performance Metrics ===")
    metrics = dashboard.get_performance_metrics()
    print(metrics)

    print("\n=== Confusion Matrix ===")
    cm = dashboard.get_confusion_matrix_dict()
    print(cm)

    print("\n=== Feature Importance ===")
    feature_importance = dashboard.get_feature_importance(model, top_n=6)
    print(feature_importance)

    print("\n=== ROC Data ===")
    roc_data = dashboard.get_roc_data()
    print(f"AUC: {roc_data['auc']}")

    # Model comparison example
    print("\n=== Model Comparison ===")
    comparison = ModelComparison()
    comparison.add_model('Random Forest', y_test, y_pred, training_time=2.3)

    # Simulate other models
    y_pred_lr = np.random.binomial(1, 0.85, len(y_test))
    comparison.add_model('Logistic Regression', y_test, y_pred_lr, training_time=0.8)

    models_table = comparison.get_comparison_table()
    print(models_table)

    # Example SHAP values (you would calculate these using the shap library)
    # import shap
    # explainer = shap.TreeExplainer(model)
    # shap_values = explainer.shap_values(X_test)
    # mean_shap = np.abs(shap_values).mean(axis=0)

    # For demonstration, use random values
    mock_shap_values = np.random.randn(len(feature_names)) * 0.3

    print("\n=== SHAP Values ===")
    shap_summary = dashboard.get_shap_summary(mock_shap_values, feature_names, top_n=4)
    print(shap_summary)

    print("\n✅ All data prepared successfully!")
    print("\nYou can now pass these dictionaries to your Flask/Django template.")
    print("Example:")
    print("  return render_template('results.html',")
    print("      metrics=metrics,")
    print("      confusion_matrix=cm,")
    print("      feature_importance=feature_importance,")
    print("      shap_values=shap_summary)")
