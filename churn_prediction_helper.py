"""
Customer Churn Prediction Dashboard - Python Helper
Prepare churn prediction data for the dashboard UI
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Optional


class ChurnPredictionDashboard:
    """
    Helper class to prepare customer churn prediction results for the dashboard.
    Transforms model outputs into the format expected by the HTML templates.
    """

    def __init__(self, customer_data: pd.DataFrame):
        """
        Initialize with customer data.

        Args:
            customer_data: DataFrame with columns:
                - customer_id: Unique customer identifier
                - customer_name: Company/customer name
                - monthly_revenue: Monthly revenue from customer
                - churn_probability: Model-predicted churn probability (0-1)
                - actual_churn: Actual churn status (0 or 1) - optional
        """
        self.customer_data = customer_data

    def get_revenue_impact_metrics(self) -> Dict:
        """
        Calculate revenue impact metrics for the dashboard.

        Returns:
            dict: Revenue impact metrics including:
                - estimated_revenue_loss: Annual revenue at risk
                - high_value_at_risk: Count of high-value customers at risk
                - total_likely_churn: Total customers likely to churn
                - avg_revenue_per_customer: Average monthly revenue per customer
        """
        # Filter high-risk customers (>70% churn probability)
        high_risk = self.customer_data[self.customer_data['churn_probability'] > 0.7]

        # Calculate metrics
        monthly_loss = high_risk['monthly_revenue'].sum()
        annual_loss = monthly_loss * 12

        # High-value customers are those with >$2000/month at risk
        high_value_at_risk = len(high_risk[high_risk['monthly_revenue'] > 2000])

        # Medium + High risk (>50% churn probability)
        at_risk = self.customer_data[self.customer_data['churn_probability'] > 0.5]
        total_likely_churn = len(at_risk)

        avg_revenue = at_risk['monthly_revenue'].mean()

        return {
            'estimated_revenue_loss': round(annual_loss / 1000, 1),  # in thousands
            'high_value_at_risk': high_value_at_risk,
            'total_likely_churn': total_likely_churn,
            'avg_revenue_per_customer': round(avg_revenue, 0)
        }

    def get_high_value_customers_at_risk(
        self,
        min_revenue: float = 2000,
        min_churn_prob: float = 0.7,
        top_n: int = 10
    ) -> List[Dict]:
        """
        Get list of high-value customers at risk.

        Args:
            min_revenue: Minimum monthly revenue to be considered high-value
            min_churn_prob: Minimum churn probability to be considered at risk
            top_n: Number of top customers to return

        Returns:
            list: List of customer dictionaries sorted by churn probability
        """
        # Filter high-value customers at risk
        high_value = self.customer_data[
            (self.customer_data['monthly_revenue'] >= min_revenue) &
            (self.customer_data['churn_probability'] >= min_churn_prob)
        ].copy()

        # Sort by churn probability descending
        high_value = high_value.sort_values('churn_probability', ascending=False)

        # Take top N
        high_value = high_value.head(top_n)

        # Convert to list of dicts
        customers = []
        for _, row in high_value.iterrows():
            customers.append({
                'id': row['customer_id'],
                'name': row['customer_name'],
                'monthly_revenue': int(row['monthly_revenue']),
                'churn_prob': round(row['churn_probability'], 2),
                'risk_factors': row.get('risk_factors', 'Analysis in progress')
            })

        return customers

    def get_customer_segmentation(self) -> List[Dict]:
        """
        Segment customers by churn risk level.

        Returns:
            list: List of segments with counts
        """
        total = len(self.customer_data)

        # Define risk thresholds
        high_risk = len(self.customer_data[self.customer_data['churn_probability'] > 0.7])
        medium_risk = len(self.customer_data[
            (self.customer_data['churn_probability'] > 0.4) &
            (self.customer_data['churn_probability'] <= 0.7)
        ])
        low_risk = total - high_risk - medium_risk

        return [
            {'name': 'High Risk', 'value': high_risk, 'color': '#dc2626'},
            {'name': 'Medium Risk', 'value': medium_risk, 'color': '#f59e0b'},
            {'name': 'Low Risk', 'value': low_risk, 'color': '#16a34a'},
        ]

    def get_churn_reasons(
        self,
        feature_importance: Dict[str, float],
        top_n: int = 6
    ) -> List[Dict]:
        """
        Get top churn reasons from feature importance.

        Args:
            feature_importance: Dictionary mapping feature names to importance scores
            top_n: Number of top reasons to return

        Returns:
            list: List of churn reasons sorted by importance
        """
        # Convert to list of dicts
        reasons = [
            {'reason': name, 'importance': round(importance, 2)}
            for name, importance in feature_importance.items()
        ]

        # Sort by importance and take top N
        reasons.sort(key=lambda x: x['importance'], reverse=True)
        return reasons[:top_n]

    def get_customer_shap_values(
        self,
        customer_id: str,
        shap_values: Dict[str, float],
        feature_descriptions: Optional[Dict[str, str]] = None,
        top_n: int = 6
    ) -> Dict:
        """
        Get SHAP values for a specific customer showing why they will churn.

        Args:
            customer_id: Customer ID to analyze
            shap_values: Dictionary mapping feature names to SHAP values
            feature_descriptions: Optional descriptions for each feature
            top_n: Number of top features to return

        Returns:
            dict: Customer info and SHAP values
        """
        # Get customer info
        customer = self.customer_data[
            self.customer_data['customer_id'] == customer_id
        ].iloc[0]

        # Convert SHAP values to list
        shap_list = []
        for feature, value in shap_values.items():
            description = (
                feature_descriptions.get(feature, 'Contributes to churn prediction')
                if feature_descriptions
                else 'Contributes to churn prediction'
            )

            shap_list.append({
                'feature': feature,
                'value': round(value, 2),
                'description': description
            })

        # Sort by absolute value and take top N
        shap_list.sort(key=lambda x: abs(x['value']), reverse=True)
        shap_list = shap_list[:top_n]

        return {
            'customer_id': customer_id,
            'customer_name': customer['customer_name'],
            'monthly_revenue': int(customer['monthly_revenue']),
            'churn_probability': round(customer['churn_probability'], 2),
            'contract_type': customer.get('contract_type', 'Unknown'),
            'shap_values': shap_list
        }


# ============================================================================
# FLASK EXAMPLE
# ============================================================================

def flask_example():
    """Complete Flask application example for churn prediction."""

    code = '''
from flask import Flask, render_template
from churn_prediction_helper import ChurnPredictionDashboard
import pandas as pd
import joblib

app = Flask(__name__)

# Load your trained model
model = joblib.load('churn_model.pkl')

@app.route('/churn-dashboard')
def churn_dashboard():
    # Load customer data
    customers = pd.read_csv('customer_data.csv')

    # Get predictions
    X = customers[feature_columns]
    customers['churn_probability'] = model.predict_proba(X)[:, 1]

    # Initialize dashboard helper
    dashboard = ChurnPredictionDashboard(customers)

    # Prepare context for template
    context = {
        # Revenue impact metrics
        **dashboard.get_revenue_impact_metrics(),

        # High-value customers at risk
        'high_value_customers': dashboard.get_high_value_customers_at_risk(
            min_revenue=2000,
            min_churn_prob=0.7,
            top_n=10
        ),

        # Customer segmentation
        'customer_segments': dashboard.get_customer_segmentation(),

        # Churn reasons (from model feature importance)
        'churn_reasons': dashboard.get_churn_reasons(
            feature_importance={
                'Low Engagement': 0.32,
                'High Support Tickets': 0.28,
                'Price Sensitivity': 0.22,
                'Contract Length': 0.18,
            },
            top_n=4
        ),

        # Individual customer SHAP analysis
        'customer_analysis': dashboard.get_customer_shap_values(
            customer_id='C10234',
            shap_values={
                'Low Product Engagement': 0.48,
                'Payment Delays': 0.34,
                'Support Ticket Volume': 0.29,
                'Contract Expiration': 0.22,
            },
            feature_descriptions={
                'Low Product Engagement': 'Last login: 18 days ago • Feature usage dropped 67%',
                'Payment Delays': '2 late payments in last 3 months',
                'Support Ticket Volume': '12 support tickets in last 30 days (3x average)',
                'Contract Expiration': 'Contract expires in 45 days • No renewal discussions initiated',
            }
        )
    }

    return render_template('churn-prediction-template.html', **context)

if __name__ == '__main__':
    app.run(debug=True)
'''
    return code


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == '__main__':
    """
    Complete example showing how to use ChurnPredictionDashboard.
    """

    # Sample customer data
    np.random.seed(42)

    customers = pd.DataFrame({
        'customer_id': [f'C{10000 + i}' for i in range(100)],
        'customer_name': [f'Company {i}' for i in range(100)],
        'monthly_revenue': np.random.exponential(2000, 100) + 500,
        'churn_probability': np.random.beta(2, 5, 100),
        'contract_type': np.random.choice(['Basic', 'Professional', 'Enterprise'], 100),
        'risk_factors': np.random.choice([
            'Low engagement',
            'Late payments',
            'Support tickets increasing',
            'Exploring competitors',
            'Contract expiring soon'
        ], 100)
    })

    # Initialize dashboard
    dashboard = ChurnPredictionDashboard(customers)

    print("=" * 60)
    print("CUSTOMER CHURN PREDICTION DASHBOARD")
    print("=" * 60)

    # Revenue Impact Metrics
    print("\n=== Revenue Impact Metrics ===")
    metrics = dashboard.get_revenue_impact_metrics()
    print(f"Estimated Revenue Loss (Annual): ${metrics['estimated_revenue_loss']}K")
    print(f"High-Value Customers at Risk: {metrics['high_value_at_risk']}")
    print(f"Total Likely to Churn: {metrics['total_likely_churn']}")
    print(f"Avg Revenue Per Customer: ${metrics['avg_revenue_per_customer']}")

    # High-Value Customers at Risk
    print("\n=== High-Value Customers at Risk ===")
    high_value = dashboard.get_high_value_customers_at_risk(
        min_revenue=2000,
        min_churn_prob=0.7,
        top_n=5
    )
    for customer in high_value:
        print(f"{customer['id']} | {customer['name']:<20} | "
              f"${customer['monthly_revenue']:>6} | "
              f"{customer['churn_prob']*100:>5.1f}% | "
              f"{customer['risk_factors']}")

    # Customer Segmentation
    print("\n=== Customer Segmentation ===")
    segments = dashboard.get_customer_segmentation()
    for segment in segments:
        percentage = (segment['value'] / len(customers)) * 100
        print(f"{segment['name']:<15} {segment['value']:>4} customers ({percentage:>5.1f}%)")

    # Churn Reasons
    print("\n=== Top Churn Reasons ===")
    reasons = dashboard.get_churn_reasons({
        'Low Engagement': 0.32,
        'High Support Tickets': 0.28,
        'Price Sensitivity': 0.22,
        'Contract Length': 0.18,
        'Product Fit': 0.12,
        'Competitor Offers': 0.08,
    }, top_n=4)
    for reason in reasons:
        print(f"{reason['reason']:<25} {reason['importance']:>5.0%}")

    # Individual Customer SHAP Analysis
    print("\n=== Individual Customer Analysis (SHAP) ===")
    customer_analysis = dashboard.get_customer_shap_values(
        customer_id='C10000',
        shap_values={
            'Low Product Engagement': 0.48,
            'Payment Delays': 0.34,
            'Support Ticket Volume': 0.29,
            'Contract Expiration': 0.22,
        },
        feature_descriptions={
            'Low Product Engagement': 'Last login: 18 days ago',
            'Payment Delays': '2 late payments in last 3 months',
            'Support Ticket Volume': '12 support tickets (3x average)',
            'Contract Expiration': 'Contract expires in 45 days',
        }
    )

    print(f"Customer: {customer_analysis['customer_name']} ({customer_analysis['customer_id']})")
    print(f"Monthly Revenue: ${customer_analysis['monthly_revenue']}")
    print(f"Churn Probability: {customer_analysis['churn_probability']*100:.0f}%")
    print("\nKey Risk Factors:")
    for shap in customer_analysis['shap_values']:
        print(f"  {shap['feature']:<30} {shap['value']:>+.2f} | {shap['description']}")

    print("\n" + "=" * 60)
    print("✅ All data prepared successfully!")
    print("\nYou can now pass these dictionaries to your Flask/Django template.")
    print("\nExample:")
    print("  return render_template('churn-prediction-template.html',")
    print("      **dashboard.get_revenue_impact_metrics(),")
    print("      high_value_customers=dashboard.get_high_value_customers_at_risk(),")
    print("      customer_segments=dashboard.get_customer_segmentation(),")
    print("      churn_reasons=dashboard.get_churn_reasons(feature_importance),")
    print("      customer_analysis=dashboard.get_customer_shap_values('C10234', ...))")
    print("=" * 60)
