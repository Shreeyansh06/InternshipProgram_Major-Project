# ML Results Dashboard - Downloadable Files

Complete UI system for displaying Machine Learning analysis results. Designed for Python web applications (Flask, Django, FastAPI).

**Special Focus:** Customer Churn Prediction with Revenue Impact Analysis

## 📦 What You're Getting

This package includes everything you need to create professional ML results dashboards, including specialized support for customer churn prediction:

### 🎨 CSS Files (Ready to Use)

1. **ml-results.css** (8KB)
   - Main layout and structure
   - Model performance metrics cards
   - Upload section
   - SHAP analysis visualization
   - Confusion matrix styling
   - Responsive grid system

2. **ml-tables.css** (6KB)
   - Model comparison tables
   - Sortable columns
   - Responsive table layouts
   - Status badges
   - Hover effects

3. **ml-charts.css** (7KB)
   - Chart containers
   - Bar charts (feature importance)
   - Chart legends and tooltips
   - Loading states
   - ROC curve styling

### 📄 Documentation & Examples

4. **example-template.html** (15KB)
   - Complete HTML template
   - All UI components demonstrated
   - Flask/Django integration comments
   - Copy-paste ready code

5. **INTEGRATION_GUIDE.md** (18KB)
   - Step-by-step setup instructions
   - Flask integration guide
   - Django integration guide
   - Component documentation
   - Customization guide
   - Troubleshooting section

6. **python_example.py** (12KB)
   - Helper classes for data preparation
   - MLResultsDashboard class
   - ModelComparison class
   - Complete working examples
   - Flask & Django code snippets

7. **churn-prediction-template.html** (NEW - 20KB)
   - Specialized template for churn prediction
   - Revenue impact dashboard
   - High-value customers at risk table
   - Customer segmentation visualization
   - Individual customer SHAP analysis
   - Complete Flask/Django integration examples

8. **churn_prediction_helper.py** (NEW - 15KB)
   - ChurnPredictionDashboard helper class
   - Revenue impact calculation
   - Customer risk segmentation
   - Churn reason analysis
   - Individual customer SHAP formatting
   - Complete working examples

9. **README.md** (This file)
   - Overview and quick start

---

## 🚀 Quick Start (3 Steps)

### Step 1: Download Files

Download these three CSS files to your static folder:

```
your-project/
├── static/
│   └── css/
│       ├── ml-results.css      ⬅️ Download this
│       ├── ml-tables.css       ⬅️ Download this
│       └── ml-charts.css       ⬅️ Download this
```

### Step 2: Link CSS in HTML

Add to your HTML template's `<head>`:

```html
<link rel="stylesheet" href="/static/css/ml-results.css">
<link rel="stylesheet" href="/static/css/ml-tables.css">
<link rel="stylesheet" href="/static/css/ml-charts.css">
```

### Step 3: Use the Components

Copy components from `example-template.html` or see examples below.

---

## 💡 Simple Example

### Flask App

```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/results')
def show_results():
    metrics = {
        'accuracy': 94.2,
        'precision': 91.8,
        'recall': 89.5,
        'f1_score': 90.6
    }
    
    return render_template('results.html', metrics=metrics)
```

### HTML Template (results.html)

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/static/css/ml-results.css">
</head>
<body>
    <div class="ml-container">
        <h1>ML Results</h1>
        
        <div class="ml-metrics-grid">
            <div class="ml-metric-card">
                <div class="ml-metric-label">Accuracy</div>
                <div class="ml-metric-value">{{ metrics.accuracy }}%</div>
            </div>
            <!-- Add more metrics... -->
        </div>
    </div>
</body>
</html>
```

---

## 📊 What's Included in the UI

### 1. **Upload Section**
- Drag-and-drop file upload area
- File type and size guidance
- Upload status indicator

### 2. **Model Performance Metrics**
- 4-column responsive grid
- Large, readable metric values
- Change indicators (+/- vs baseline)
- Metrics: Accuracy, Precision, Recall, F1 Score

### 3. **Model Comparison Table**
- Clean, scannable table design
- Sortable columns (optional)
- Success/error indicators
- Performance metrics comparison
- Training time comparison

### 4. **Confusion Matrix**
- 2×2 grid layout
- Color-coded cells (green for correct, red for errors)
- Large, clear numbers
- Total samples display

### 5. **ROC Curve Display**
- Chart container with title and AUC score
- Image or canvas embedding support
- Works with matplotlib/plotly outputs

### 6. **Feature Importance Chart**
- Horizontal bar chart
- Clean, minimal design
- Sortable by importance value
- Feature names and scores

### 7. **SHAP Analysis**
- Feature contribution bars
- Positive/negative indicators
- Impact descriptions
- Color-coded visualization

---

## 🎨 Design Features

✅ **Professional & Clean** - Clinical precision aesthetic  
✅ **Fully Responsive** - Works on desktop, tablet, mobile  
✅ **Easy to Integrate** - Just link CSS and use class names  
✅ **Customizable** - CSS variables for colors and spacing  
✅ **No Dependencies** - Pure CSS, no JavaScript required  
✅ **Framework Agnostic** - Works with Flask, Django, FastAPI  

---

## 📖 File Purposes

| File | Purpose | Size |
|------|---------|------|
| ml-results.css | Main styles, layout, metrics, SHAP | 8KB |
| ml-tables.css | Table styling, comparison views | 6KB |
| ml-charts.css | Chart containers, visualizations | 7KB |
| example-template.html | Complete HTML example | 15KB |
| INTEGRATION_GUIDE.md | Detailed documentation | 18KB |
| python_example.py | Python helper classes | 12KB |

**Total Package Size:** ~66KB

---

## 🎯 Supported Python Frameworks

- ✅ **Flask** - Full support with examples
- ✅ **Django** - Full support with examples
- ✅ **FastAPI** - Works with Jinja2 templates
- ✅ **Bottle** - Compatible
- ✅ **Pyramid** - Compatible
- ✅ Any Python web framework with HTML templating

---

## 🔧 Customization

### Change Colors

Edit `ml-results.css` variables:

```css
:root {
  --primary-color: #030213;      /* Your brand color */
  --success: #16a34a;            /* Success green */
  --error: #dc2626;              /* Error red */
  --chart-primary: #2563eb;      /* Chart color */
}
```

### Adjust Layout

All spacing uses consistent scale:
- `ml-section` - 32px bottom margin
- `ml-card` - 32px padding
- `ml-metrics-grid` - 16px gap
- `ml-viz-grid` - 32px gap

### Responsive Breakpoints

- **Desktop:** 1024px+
- **Tablet:** 768px - 1024px
- **Mobile:** < 768px

---

## 📚 Documentation

**Quick Start:** Read this file  
**Component Guide:** See `example-template.html`  
**Full Documentation:** Read `INTEGRATION_GUIDE.md`  
**Python Examples:** See `python_example.py`

---

## 🎓 Learning Path

1. **Beginners:** Start with `example-template.html`, copy components
2. **Intermediate:** Use `python_example.py` helper classes
3. **Advanced:** Read `INTEGRATION_GUIDE.md` for full customization

---

## ✅ Checklist for Integration

- [ ] Download all 3 CSS files
- [ ] Place in your static/css folder
- [ ] Link CSS files in HTML `<head>`
- [ ] Copy HTML components from example template
- [ ] Prepare Python data using helper classes
- [ ] Pass data to template
- [ ] Test responsive layout
- [ ] Customize colors (optional)

---

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

Uses modern CSS features:
- CSS Grid
- CSS Custom Properties (variables)
- Flexbox

---

## 🎯 Customer Churn Prediction (NEW!)

This package now includes specialized components for customer churn prediction:

### Churn-Specific Features

✅ **Revenue Impact Dashboard**
- Estimated annual revenue loss
- High-value customers at risk count
- Total customers likely to churn
- Average revenue per customer

✅ **High-Value Customer Table**
- Customer ID and company name
- Monthly revenue contribution
- Churn probability with visual indicator
- Specific risk factors

✅ **Why Customers Churn**
- Top reasons driving attrition
- Feature importance visualization
- Data-driven insights

✅ **Individual Customer Analysis**
- SHAP values for specific customers
- Detailed risk factor breakdown
- Actionable insights per customer

### Quick Start for Churn Prediction

```python
from churn_prediction_helper import ChurnPredictionDashboard
import pandas as pd

# Load your customer data
customers = pd.read_csv('customers.csv')
# Add churn predictions
customers['churn_probability'] = model.predict_proba(X)[:, 1]

# Initialize dashboard
dashboard = ChurnPredictionDashboard(customers)

# Get all metrics for template
context = {
    **dashboard.get_revenue_impact_metrics(),
    'high_value_customers': dashboard.get_high_value_customers_at_risk(),
    'customer_segments': dashboard.get_customer_segmentation(),
}

return render_template('churn-prediction-template.html', **context)
```

---

## 📋 Data Structure Expected

### General ML Results

The HTML templates expect these Python data structures:

```python
# Metrics
metrics = {
    'accuracy': 94.2,
    'precision': 91.8,
    'recall': 89.5,
    'f1_score': 90.6
}

# Models (list of dicts)
models = [
    {
        'name': 'Random Forest',
        'accuracy': 94.2,
        'precision': 91.8,
        'recall': 89.5,
        'f1_score': 90.6,
        'training_time': 2.3
    },
    # ... more models
]

# Confusion Matrix
confusion_matrix = {
    'true_negative': 4521,
    'false_positive': 234,
    'false_negative': 187,
    'true_positive': 3058
}

# Feature Importance (list of dicts)
feature_importance = [
    {'name': 'Age', 'importance': 0.28},
    {'name': 'Income', 'importance': 0.24},
    # ... more features
]

# SHAP Values (list of dicts)
shap_values = [
    {
        'feature': 'Age',
        'value': 0.42,
        'description': 'Strong positive contribution'
    },
    # ... more features
]
```

Use the `MLResultsDashboard` class in `python_example.py` to generate these automatically!

### Churn Prediction Specific

For churn prediction, use the `ChurnPredictionDashboard` class:

```python
# Revenue Impact Metrics (auto-calculated)
metrics = {
    'estimated_revenue_loss': 214.8,  # in thousands
    'high_value_at_risk': 5,
    'total_likely_churn': 909,
    'avg_revenue_per_customer': 3520
}

# High-Value Customers at Risk
high_value_customers = [
    {
        'id': 'C10234',
        'name': 'Enterprise Corp',
        'monthly_revenue': 4850,
        'churn_prob': 0.89,
        'risk_factors': 'Low engagement, Late payments'
    },
    # ... more customers
]

# Customer Segmentation
customer_segments = [
    {'name': 'High Risk', 'value': 342, 'color': '#dc2626'},
    {'name': 'Medium Risk', 'value': 567, 'color': '#f59e0b'},
    {'name': 'Low Risk', 'value': 2891, 'color': '#16a34a'},
]

# Churn Reasons
churn_reasons = [
    {'reason': 'Low Engagement', 'importance': 0.32},
    {'reason': 'High Support Tickets', 'importance': 0.28},
    # ... more reasons
]

# Individual Customer SHAP Analysis
customer_analysis = {
    'customer_id': 'C10234',
    'customer_name': 'Enterprise Corp',
    'monthly_revenue': 4850,
    'churn_probability': 0.89,
    'shap_values': [
        {
            'feature': 'Low Product Engagement',
            'value': 0.48,
            'description': 'Last login: 18 days ago'
        },
        # ... more SHAP values
    ]
}
```

The `ChurnPredictionDashboard` helper class generates all these automatically from your customer DataFrame!

---

## 🆘 Need Help?

1. Check `example-template.html` for HTML structure
2. Read `INTEGRATION_GUIDE.md` for detailed guide
3. Review `python_example.py` for data preparation
4. Verify CSS files are linked correctly
5. Ensure Python data structures match expected format

---

## 📝 License

Free to use in your ML projects. Modify as needed.

---

## 🎉 You're Ready!

Everything you need is in these 7 files:

1. **ml-results.css** - Main styles
2. **ml-tables.css** - Table styles
3. **ml-charts.css** - Chart styles
4. **example-template.html** - HTML examples
5. **INTEGRATION_GUIDE.md** - Full documentation
6. **python_example.py** - Python helpers
7. **README.md** - This overview

**Next Step:** Download the CSS files and start integrating! 🚀
