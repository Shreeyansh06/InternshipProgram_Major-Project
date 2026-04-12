"""
Complete Customer Churn Prediction Dashboard
Copy this file and run it directly: python complete_churn_app.py

This is a fully working example that creates sample data and runs a complete
churn prediction dashboard. Replace the sample data with your real data.
"""

from flask import Flask, render_template, send_file
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import io

app = Flask(__name__)

# ============================================================================
# CHURN PREDICTION DASHBOARD HELPER CLASS
# ============================================================================

class ChurnPredictionDashboard:
    """Helper class to prepare churn prediction data for the dashboard."""

    def __init__(self, customer_data):
        self.customer_data = customer_data

    def get_revenue_impact_metrics(self):
        """Calculate revenue impact metrics."""
        high_risk = self.customer_data[self.customer_data['churn_probability'] > 0.7]
        monthly_loss = high_risk['monthly_revenue'].sum()
        annual_loss = monthly_loss * 12

        high_value_at_risk = len(high_risk[high_risk['monthly_revenue'] > 2000])
        at_risk = self.customer_data[self.customer_data['churn_probability'] > 0.5]
        total_likely_churn = len(at_risk)
        avg_revenue = at_risk['monthly_revenue'].mean()

        return {
            'estimated_revenue_loss': round(annual_loss / 1000, 1),
            'high_value_at_risk': high_value_at_risk,
            'total_likely_churn': total_likely_churn,
            'avg_revenue_per_customer': round(avg_revenue, 0)
        }

    def get_high_value_customers_at_risk(self, min_revenue=2000, min_churn_prob=0.7, top_n=10):
        """Get list of high-value customers at risk."""
        high_value = self.customer_data[
            (self.customer_data['monthly_revenue'] >= min_revenue) &
            (self.customer_data['churn_probability'] >= min_churn_prob)
        ].copy()

        high_value = high_value.sort_values('churn_probability', ascending=False).head(top_n)

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

    def get_customer_segmentation(self):
        """Segment customers by churn risk level."""
        total = len(self.customer_data)
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

    def get_churn_reasons(self, feature_importance, top_n=6):
        """Get top churn reasons from feature importance."""
        reasons = [
            {'reason': name, 'importance': round(importance, 2)}
            for name, importance in feature_importance.items()
        ]
        reasons.sort(key=lambda x: x['importance'], reverse=True)
        return reasons[:top_n]

    def get_customer_shap_values(self, customer_id, shap_values, feature_descriptions=None):
        """Get SHAP values for a specific customer."""
        customer = self.customer_data[
            self.customer_data['customer_id'] == customer_id
        ].iloc[0]

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

        shap_list.sort(key=lambda x: abs(x['value']), reverse=True)

        return {
            'customer_id': customer_id,
            'customer_name': customer['customer_name'],
            'monthly_revenue': int(customer['monthly_revenue']),
            'churn_probability': round(customer['churn_probability'], 2),
            'contract_type': customer.get('contract_type', 'Unknown'),
            'shap_values': shap_list
        }


# ============================================================================
# DATA GENERATION (Replace with your real data)
# ============================================================================

def generate_sample_data(n_customers=1000):
    """
    Generate sample customer data for demonstration.

    REPLACE THIS with your real customer data loading:
    customers = pd.read_csv('your_customers.csv')
    or
    customers = pd.read_sql('SELECT * FROM customers', db_connection)
    """

    np.random.seed(42)

    # Company name generator
    prefixes = ['Tech', 'Global', 'Digital', 'Cloud', 'Innovative', 'Smart',
                'Advanced', 'Premier', 'Elite', 'Enterprise']
    suffixes = ['Solutions', 'Systems', 'Corp', 'Inc', 'Services', 'Group',
                'Technologies', 'Enterprises', 'Partners', 'Innovations']

    names = [f"{np.random.choice(prefixes)} {np.random.choice(suffixes)} {i}"
             for i in range(n_customers)]

    customers = pd.DataFrame({
        'customer_id': [f'C{10000 + i}' for i in range(n_customers)],
        'customer_name': names,
        'monthly_revenue': np.random.exponential(2000, n_customers) + 500,

        # Features for churn prediction
        'engagement_score': np.random.uniform(0, 100, n_customers),
        'support_tickets': np.random.poisson(3, n_customers),
        'payment_delays': np.random.binomial(5, 0.2, n_customers),
        'contract_months': np.random.choice([1, 6, 12, 24], n_customers),
        'feature_usage': np.random.uniform(0, 100, n_customers),
        'customer_tenure_months': np.random.randint(1, 60, n_customers),
        'contract_type': np.random.choice(['Basic', 'Professional', 'Enterprise'], n_customers),
    })

    return customers


def train_churn_model(customers):
    """
    Train churn prediction model.

    REPLACE THIS with your actual trained model:
    model = joblib.load('your_churn_model.pkl')
    predictions = model.predict_proba(X)[:, 1]
    """

    # Features
    feature_cols = ['engagement_score', 'support_tickets', 'payment_delays',
                   'contract_months', 'feature_usage', 'customer_tenure_months']
    X = customers[feature_cols]

    # Create synthetic churn labels (for demonstration)
    # In production, use actual historical churn: y = customers['churned']
    y = (
        (customers['engagement_score'] < 30) |
        (customers['support_tickets'] > 5) |
        (customers['payment_delays'] > 2) |
        (customers['feature_usage'] < 20)
    ).astype(int)

    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
    model.fit(X, y)

    # Get predictions
    customers['churn_probability'] = model.predict_proba(X)[:, 1]

    # Get feature importance
    feature_importance = dict(zip(feature_cols, model.feature_importances_))

    return customers, feature_importance, model


def add_risk_factors(customers):
    """Add human-readable risk factors."""

    def get_risk_factors(row):
        factors = []
        if row['engagement_score'] < 30:
            factors.append('Low engagement')
        if row['support_tickets'] > 5:
            factors.append('High support volume')
        if row['payment_delays'] > 2:
            factors.append('Payment delays')
        if row['contract_months'] <= 1:
            factors.append('Month-to-month contract')
        if row['feature_usage'] < 20:
            factors.append('Low feature usage')
        if row['customer_tenure_months'] < 6:
            factors.append('New customer')

        return ', '.join(factors[:3]) if factors else 'Multiple minor factors'

    customers['risk_factors'] = customers.apply(get_risk_factors, axis=1)
    return customers


def get_shap_values_for_customer(customer_id, customers):
    """
    Get SHAP values for specific customer.

    In production, use the actual SHAP library:
    import shap
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    """

    customer = customers[customers['customer_id'] == customer_id].iloc[0]

    shap_values = {}
    descriptions = {}

    # Calculate mock SHAP values based on customer features
    if customer['engagement_score'] < 30:
        shap_values['Low Product Engagement'] = 0.48
        descriptions['Low Product Engagement'] = (
            f"Engagement score: {customer['engagement_score']:.0f}/100 • "
            f"Last active {np.random.randint(10, 30)} days ago"
        )

    if customer['payment_delays'] > 0:
        shap_values['Payment Delays'] = 0.34
        descriptions['Payment Delays'] = (
            f"{customer['payment_delays']:.0f} late payments in last 3 months"
        )

    if customer['support_tickets'] > 3:
        shap_values['Support Ticket Volume'] = 0.29
        descriptions['Support Ticket Volume'] = (
            f"{customer['support_tickets']:.0f} support tickets "
            f"({customer['support_tickets'] / 3:.1f}x average)"
        )

    if customer['contract_months'] <= 6:
        shap_values['Contract Expiration'] = 0.22
        descriptions['Contract Expiration'] = (
            f"Contract type: {customer['contract_months']} month • "
            f"Renewal discussion needed"
        )

    if customer['feature_usage'] < 30:
        shap_values['Low Feature Adoption'] = 0.18
        descriptions['Low Feature Adoption'] = (
            f"Using only {customer['feature_usage']:.0f}% of available features"
        )

    return shap_values, descriptions


# ============================================================================
# FLASK ROUTES
# ============================================================================

@app.route('/')
@app.route('/churn')
def churn_dashboard():
    """Main churn prediction dashboard."""

    # 1. Load customer data
    customers = generate_sample_data(n_customers=1000)

    # 2. Train model and get predictions
    customers, feature_importance, model = train_churn_model(customers)

    # 3. Add risk factors
    customers = add_risk_factors(customers)

    # 4. Initialize dashboard helper
    dashboard = ChurnPredictionDashboard(customers)

    # 5. Get customer for detailed SHAP analysis
    high_value = dashboard.get_high_value_customers_at_risk(top_n=1)
    if high_value:
        customer_id = high_value[0]['id']
        shap_values, shap_descriptions = get_shap_values_for_customer(
            customer_id, customers
        )
        customer_analysis = dashboard.get_customer_shap_values(
            customer_id=customer_id,
            shap_values=shap_values,
            feature_descriptions=shap_descriptions
        )
    else:
        customer_analysis = None

    # 6. Prepare context for template
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

        # Churn reasons (mapped from feature importance)
        'churn_reasons': dashboard.get_churn_reasons({
            'Low Engagement': feature_importance.get('engagement_score', 0),
            'High Support Tickets': feature_importance.get('support_tickets', 0),
            'Payment Issues': feature_importance.get('payment_delays', 0),
            'Contract Type': feature_importance.get('contract_months', 0),
            'Feature Adoption': feature_importance.get('feature_usage', 0),
            'Customer Tenure': feature_importance.get('customer_tenure_months', 0),
        }, top_n=4),

        # Individual customer analysis
        'customer_analysis': customer_analysis,
    }

    return render_template('churn-prediction-template.html', **context)


@app.route('/export/customers')
def export_customers():
    """Export high-value customers at risk to CSV."""

    customers = generate_sample_data(n_customers=1000)
    customers, _, _ = train_churn_model(customers)
    customers = add_risk_factors(customers)

    dashboard = ChurnPredictionDashboard(customers)
    high_value = dashboard.get_high_value_customers_at_risk(top_n=100)

    df = pd.DataFrame(high_value)

    # Create CSV
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='high_value_customers_at_risk.csv'
    )


# ============================================================================
# RUN THE APP
# ============================================================================

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("Customer Churn Prediction Dashboard")
    print("=" * 70)
    print("\nStarting Flask server...")
    print("\n📊 Dashboard will be available at:")
    print("   http://localhost:5000/churn")
    print("\n💾 Export CSV available at:")
    print("   http://localhost:5000/export/customers")
    print("\n⚠️  This uses sample data. Replace with your real data in the functions above.")
    print("=" * 70 + "\n")

    app.run(debug=True, port=5000, host='0.0.0.0')
