# Customer Churn Prediction Dashboard - Complete Guide

This guide shows you how to build a complete customer churn prediction dashboard with revenue impact analysis.

## 📊 What This Dashboard Shows

Your churn prediction dashboard will display:

1. **Revenue Impact Metrics**
   - Estimated annual revenue loss from churning customers
   - Number of high-value customers at risk
   - Total customers likely to churn (next 30 days)
   - Average monthly revenue per at-risk customer

2. **High-Value Customers at Risk**
   - Detailed table of top customers likely to leave
   - Churn probability for each customer
   - Monthly revenue contribution
   - Specific risk factors per customer

3. **Why Customers Churn**
   - Top reasons driving customer attrition
   - Feature importance from your ML model
   - Actionable insights

4. **Individual Customer Analysis**
   - SHAP values showing why specific customers will churn
   - Detailed breakdown of risk factors
   - Customer-specific recommendations

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Required Packages

```bash
pip install pandas numpy scikit-learn flask
# Optional: pip install shap  # for SHAP analysis
```

### Step 2: Download Files

Download these files to your project:

```
your-project/
├── static/
│   └── css/
│       ├── ml-results.css
│       ├── ml-tables.css
│       └── ml-charts.css
├── templates/
│   └── churn-prediction-template.html
└── churn_prediction_helper.py
```

### Step 3: Prepare Your Data

```python
from churn_prediction_helper import ChurnPredictionDashboard
import pandas as pd

# Your customer data should have these columns:
# - customer_id: Unique identifier
# - customer_name: Company/customer name
# - monthly_revenue: Monthly revenue from customer
# - churn_probability: Model prediction (0-1)

customers = pd.read_csv('your_customer_data.csv')

# If you haven't added predictions yet:
# customers['churn_probability'] = your_model.predict_proba(X)[:, 1]

# Initialize dashboard helper
dashboard = ChurnPredictionDashboard(customers)
```

### Step 4: Create Flask Route

```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/churn')
def churn_dashboard():
    context = {
        # Revenue metrics (auto-calculated)
        **dashboard.get_revenue_impact_metrics(),
        
        # High-value customers
        'high_value_customers': dashboard.get_high_value_customers_at_risk(),
        
        # Customer segmentation
        'customer_segments': dashboard.get_customer_segmentation(),
        
        # Churn reasons from your model
        'churn_reasons': dashboard.get_churn_reasons({
            'Low Engagement': 0.32,
            'High Support Tickets': 0.28,
            'Price Sensitivity': 0.22,
            'Contract Length': 0.18,
        }),
    }
    
    return render_template('churn-prediction-template.html', **context)

if __name__ == '__main__':
    app.run(debug=True)
```

### Step 5: Run Your App

```bash
python app.py
# Visit http://localhost:5000/churn
```

---

## 📖 Complete Example

Here's a complete, working example from data preparation to dashboard:

```python
"""
complete_churn_dashboard.py
Complete example of customer churn prediction dashboard
"""

from flask import Flask, render_template
from churn_prediction_helper import ChurnPredictionDashboard
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

app = Flask(__name__)

# ===== 1. Load and Prepare Data =====

def load_customer_data():
    """Load or create customer data."""
    
    # Example: Load from CSV
    # customers = pd.read_csv('customers.csv')
    
    # For demo, create sample data
    np.random.seed(42)
    n_customers = 1000
    
    customers = pd.DataFrame({
        'customer_id': [f'C{10000 + i}' for i in range(n_customers)],
        'customer_name': [f'Company {i}' for i in range(n_customers)],
        'monthly_revenue': np.random.exponential(2000, n_customers) + 500,
        
        # Features for prediction
        'engagement_score': np.random.uniform(0, 100, n_customers),
        'support_tickets': np.random.poisson(3, n_customers),
        'payment_delays': np.random.binomial(5, 0.2, n_customers),
        'contract_months': np.random.choice([1, 6, 12, 24], n_customers),
        'feature_usage': np.random.uniform(0, 100, n_customers),
    })
    
    return customers

# ===== 2. Train Churn Model =====

def train_churn_model(customers):
    """Train a simple churn prediction model."""
    
    # Features
    feature_cols = ['engagement_score', 'support_tickets', 'payment_delays', 
                   'contract_months', 'feature_usage']
    X = customers[feature_cols]
    
    # Create synthetic churn labels (for demo)
    # In production, use actual historical churn data
    y = (
        (customers['engagement_score'] < 30) | 
        (customers['support_tickets'] > 5) |
        (customers['payment_delays'] > 2)
    ).astype(int)
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Get predictions
    customers['churn_probability'] = model.predict_proba(X)[:, 1]
    
    # Get feature importance
    feature_importance = dict(zip(feature_cols, model.feature_importances_))
    
    return customers, feature_importance, model

# ===== 3. Add Risk Factors =====

def add_risk_factors(customers):
    """Add human-readable risk factors to customer data."""
    
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
        
        return ', '.join(factors) if factors else 'Multiple minor factors'
    
    customers['risk_factors'] = customers.apply(get_risk_factors, axis=1)
    return customers

# ===== 4. Calculate SHAP Values (Optional) =====

def get_shap_values_for_customer(customer_id, customers, model):
    """
    Calculate SHAP values for a specific customer.
    In production, use the actual SHAP library.
    """
    
    customer = customers[customers['customer_id'] == customer_id].iloc[0]
    
    # For demo, create mock SHAP values
    # In production: import shap; explainer = shap.TreeExplainer(model); shap_values = explainer.shap_values(X)
    
    shap_values = {}
    descriptions = {}
    
    if customer['engagement_score'] < 30:
        shap_values['Low Product Engagement'] = 0.48
        descriptions['Low Product Engagement'] = f"Engagement score: {customer['engagement_score']:.0f}/100"
    
    if customer['payment_delays'] > 0:
        shap_values['Payment Delays'] = 0.34
        descriptions['Payment Delays'] = f"{customer['payment_delays']:.0f} late payments in last 3 months"
    
    if customer['support_tickets'] > 3:
        shap_values['Support Ticket Volume'] = 0.29
        descriptions['Support Ticket Volume'] = f"{customer['support_tickets']:.0f} support tickets (above average)"
    
    if customer['contract_months'] <= 6:
        shap_values['Contract Expiration'] = 0.22
        descriptions['Contract Expiration'] = f"Short contract: {customer['contract_months']:.0f} months"
    
    return shap_values, descriptions

# ===== 5. Flask Routes =====

@app.route('/')
@app.route('/churn')
def churn_dashboard():
    """Main churn prediction dashboard."""
    
    # Load data
    customers = load_customer_data()
    
    # Train model and get predictions
    customers, feature_importance, model = train_churn_model(customers)
    
    # Add risk factors
    customers = add_risk_factors(customers)
    
    # Initialize dashboard helper
    dashboard = ChurnPredictionDashboard(customers)
    
    # Get high-value customer at highest risk for detailed analysis
    high_value = dashboard.get_high_value_customers_at_risk(top_n=1)
    if high_value:
        customer_id = high_value[0]['id']
        shap_values, shap_descriptions = get_shap_values_for_customer(
            customer_id, customers, model
        )
        customer_analysis = dashboard.get_customer_shap_values(
            customer_id=customer_id,
            shap_values=shap_values,
            feature_descriptions=shap_descriptions
        )
    else:
        customer_analysis = None
    
    # Prepare context
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
        }, top_n=4),
        
        # Individual customer analysis
        'customer_analysis': customer_analysis,
    }
    
    return render_template('churn-prediction-template.html', **context)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

## 🎯 Understanding the Output

### Revenue Impact Metrics

```python
metrics = dashboard.get_revenue_impact_metrics()

# Returns:
{
    'estimated_revenue_loss': 214.8,  # Annual revenue at risk (in thousands)
    'high_value_at_risk': 5,          # Customers with >$2K/month revenue
    'total_likely_churn': 909,        # All at-risk customers (>50% prob)
    'avg_revenue_per_customer': 3520  # Average monthly revenue
}
```

### High-Value Customers

```python
customers = dashboard.get_high_value_customers_at_risk(
    min_revenue=2000,      # Minimum monthly revenue
    min_churn_prob=0.7,    # Minimum churn probability
    top_n=10               # Number to return
)

# Returns list of:
{
    'id': 'C10234',
    'name': 'Enterprise Corp',
    'monthly_revenue': 4850,
    'churn_prob': 0.89,
    'risk_factors': 'Low engagement, Late payments'
}
```

### Customer Segmentation

```python
segments = dashboard.get_customer_segmentation()

# Returns:
[
    {'name': 'High Risk', 'value': 342, 'color': '#dc2626'},    # >70% prob
    {'name': 'Medium Risk', 'value': 567, 'color': '#f59e0b'},  # 40-70% prob
    {'name': 'Low Risk', 'value': 2891, 'color': '#16a34a'},    # <40% prob
]
```

---

## 🔧 Customization

### Change Risk Thresholds

```python
# In churn_prediction_helper.py, modify get_customer_segmentation():

high_risk = len(data[data['churn_probability'] > 0.8])    # Changed from 0.7
medium_risk = len(data[
    (data['churn_probability'] > 0.5) &                   # Changed from 0.4
    (data['churn_probability'] <= 0.8)
])
```

### Change High-Value Definition

```python
# When calling the method:
high_value_customers = dashboard.get_high_value_customers_at_risk(
    min_revenue=5000,      # Changed from 2000 - only customers >$5K/month
    min_churn_prob=0.6,    # Changed from 0.7 - lower threshold
    top_n=20               # Show top 20 instead of 10
)
```

### Add Custom Metrics

```python
# Add to your Flask route:
context['custom_metric'] = {
    'label': 'Lifetime Value at Risk',
    'value': total_ltv_at_risk,
    'change': '+12% vs last month'
}

# In template, add a new metric card
```

---

## 📊 Working with Real SHAP Values

If you want to use actual SHAP values (recommended for production):

```python
import shap

# After training your model
explainer = shap.TreeExplainer(model)

# For a specific customer
customer_data = customers[customers['customer_id'] == 'C10234']
X_customer = customer_data[feature_cols]

# Get SHAP values
shap_values = explainer.shap_values(X_customer)[1]  # [1] for positive class

# Convert to dictionary
shap_dict = dict(zip(feature_cols, shap_values[0]))

# Add human-readable descriptions
descriptions = {
    'engagement_score': f"Score: {customer_data['engagement_score'].iloc[0]:.0f}/100",
    'support_tickets': f"{customer_data['support_tickets'].iloc[0]:.0f} tickets this month",
    # ... more descriptions
}

# Use in dashboard
customer_analysis = dashboard.get_customer_shap_values(
    customer_id='C10234',
    shap_values=shap_dict,
    feature_descriptions=descriptions
)
```

---

## 🎨 Styling Customization

### Change Revenue Loss Color

In `ml-results.css`:

```css
.gradient-card.revenue-loss {
    --gradient-start: #dc2626;  /* Red */
    --gradient-end: #b91c1c;    /* Darker red */
}

/* Change to blue: */
.gradient-card.revenue-loss {
    --gradient-start: #2563eb;
    --gradient-end: #1d4ed8;
}
```

### Adjust Churn Probability Colors

In `ml-tables.css`:

```css
/* High risk - red (>80%) */
.ml-churn-percentage.high {
    color: #dc2626;
}

/* Medium risk - orange (50-80%) */
.ml-churn-percentage.medium {
    color: #f59e0b;
}

/* Low risk - green (<50%) */
.ml-churn-percentage.low {
    color: #16a34a;
}
```

---

## 💾 Exporting Data

Add export functionality to your Flask route:

```python
from flask import send_file
import io

@app.route('/export/high-value-customers')
def export_high_value():
    """Export high-value customers to CSV."""
    
    customers = load_customer_data()
    dashboard = ChurnPredictionDashboard(customers)
    
    high_value = dashboard.get_high_value_customers_at_risk(top_n=100)
    df = pd.DataFrame(high_value)
    
    # Create CSV in memory
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='high_value_customers_at_risk.csv'
    )
```

---

## 🚨 Common Issues

### Issue: Revenue metrics showing as 0

**Solution:** Make sure your customer data has the `monthly_revenue` column:

```python
# Check your data
print(customers.columns)
print(customers['monthly_revenue'].describe())
```

### Issue: No high-value customers shown

**Solution:** Lower the threshold or check your data:

```python
# Debug
print(f"Max revenue: ${customers['monthly_revenue'].max()}")
print(f"Max churn prob: {customers['churn_probability'].max()}")

# Try lower thresholds
high_value = dashboard.get_high_value_customers_at_risk(
    min_revenue=500,   # Much lower
    min_churn_prob=0.5  # Lower threshold
)
```

### Issue: SHAP values not showing

**Solution:** Make sure you're passing the correct format:

```python
# Correct format
shap_values = {
    'Feature Name': 0.42,  # Float value
    'Another Feature': -0.23,
}

# With descriptions
descriptions = {
    'Feature Name': 'Human readable description',
}
```

---

## 📱 Mobile Responsive

The dashboard is fully responsive. Test on mobile:

```python
# Run on all interfaces
app.run(host='0.0.0.0', port=5000)

# Then access from mobile using your computer's IP
# http://192.168.1.xxx:5000/churn
```

---

## 🎓 Next Steps

1. **Connect to Real Data**
   - Replace sample data with your database
   - Use SQLAlchemy for database queries

2. **Add Authentication**
   - Use Flask-Login for user authentication
   - Protect sensitive customer data

3. **Schedule Updates**
   - Use APScheduler to refresh predictions daily
   - Cache results for better performance

4. **Add Alerts**
   - Email notifications for high-risk customers
   - Slack integration for real-time alerts

5. **Advanced Analytics**
   - Churn trend over time
   - Cohort analysis
   - Customer lifetime value predictions

---

## ✅ Checklist

- [ ] Downloaded all CSS files
- [ ] Downloaded churn-prediction-template.html
- [ ] Downloaded churn_prediction_helper.py
- [ ] Prepared customer data with required columns
- [ ] Trained churn prediction model
- [ ] Added churn predictions to customer data
- [ ] Created Flask route
- [ ] Tested dashboard locally
- [ ] Customized colors and thresholds
- [ ] Added real SHAP values (optional)
- [ ] Deployed to production

---

## 🆘 Support

Having issues? Check:

1. `churn_prediction_helper.py` - Run the example at the bottom
2. `churn-prediction-template.html` - Review HTML structure
3. Browser console - Check for JavaScript errors
4. Flask logs - Check for Python errors

---

**You're all set! Build an amazing churn prediction dashboard! 🚀**
