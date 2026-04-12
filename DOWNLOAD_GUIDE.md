# 📥 Download Guide - Customer Churn Prediction Dashboard

## Quick Summary

You now have a **complete customer churn prediction dashboard** ready to download and use with your Python application. The system analyzes customer data to predict who will churn, why they'll churn, and the revenue impact.

---

## 🎯 What This Dashboard Does

✅ **Predicts which customers will churn** - ML model identifies at-risk customers  
✅ **Calculates revenue impact** - Shows how much money you'll lose  
✅ **Identifies high-value customers at risk** - Prioritizes intervention  
✅ **Explains why customers churn** - SHAP analysis shows root causes  
✅ **Beautiful, responsive UI** - Professional dashboard that works on all devices  

---

## 📦 Download These Files

All files are in the `/public` folder. Download them to your project:

### 🎨 CSS Files (Required - 3 files)

1. **ml-results.css** (7.3 KB)
   - Main layout and styling
   - Revenue impact cards
   - SHAP analysis visualization
   - **Location:** Place in `static/css/ml-results.css`

2. **ml-tables.css** (6.7 KB)
   - Customer table styling
   - Churn probability bars
   - Responsive table layouts
   - **Location:** Place in `static/css/ml-tables.css`

3. **ml-charts.css** (7.0 KB)
   - Chart containers
   - Bar charts for churn reasons
   - Visualization styling
   - **Location:** Place in `static/css/ml-charts.css`

### 📄 HTML Template (Required - 1 file)

4. **churn-prediction-template.html** (22 KB)
   - Complete HTML template
   - All UI components
   - Flask/Django integration examples
   - **Location:** Place in `templates/churn-prediction-template.html`

### 🐍 Python Helper (Recommended - 1 file)

5. **churn_prediction_helper.py** (15 KB)
   - ChurnPredictionDashboard class
   - Auto-calculates all metrics
   - Formats data for template
   - **Location:** Place in your project root or utils folder

### 🚀 Complete Working Example (Recommended - 1 file)

6. **complete_churn_app.py** (14 KB)
   - Fully working Flask application
   - Sample data generation
   - Ready to run immediately
   - Use as a starting template
   - **Location:** Your project root

### 📚 Documentation (Optional - 3 files)

7. **CHURN_PREDICTION_GUIDE.md** (17 KB)
   - Complete step-by-step guide
   - Customization instructions
   - Troubleshooting tips

8. **INTEGRATION_GUIDE.md** (13 KB)
   - General ML dashboard integration
   - Flask and Django examples

9. **README.md** (13 KB)
   - Overview and quick start
   - File descriptions

### 📊 Alternative Templates (Optional - 2 files)

10. **example-template.html** (17 KB)
    - General ML results template
    - Model comparison tables
    - Confusion matrix, ROC curves

11. **python_example.py** (13 KB)
    - General ML dashboard helper
    - For non-churn use cases

---

## 🏗️ Project Structure After Download

```
your-project/
├── app.py                              # Your Flask app (or use complete_churn_app.py)
├── churn_prediction_helper.py          # Helper class (download)
├── static/
│   └── css/
│       ├── ml-results.css              # Download
│       ├── ml-tables.css               # Download
│       └── ml-charts.css               # Download
├── templates/
│   └── churn-prediction-template.html  # Download
└── data/
    └── customers.csv                   # Your customer data
```

---

## ⚡ Quick Start (3 Steps)

### Option A: Use Complete Example (Fastest - 2 Minutes)

```bash
# 1. Download complete_churn_app.py
# 2. Download the CSS files and HTML template
# 3. Run it!

pip install flask pandas numpy scikit-learn
python complete_churn_app.py

# Visit http://localhost:5000/churn
```

### Option B: Integrate with Your Data (10 Minutes)

```bash
# 1. Download all required files (CSS + HTML + helper)
# 2. Install dependencies
pip install flask pandas numpy scikit-learn

# 3. Create your Flask app:
```

```python
from flask import Flask, render_template
from churn_prediction_helper import ChurnPredictionDashboard
import pandas as pd

app = Flask(__name__)

@app.route('/churn')
def churn_dashboard():
    # Load your data
    customers = pd.read_csv('customers.csv')
    
    # Add predictions (use your trained model)
    customers['churn_probability'] = your_model.predict_proba(X)[:, 1]
    
    # Initialize helper
    dashboard = ChurnPredictionDashboard(customers)
    
    # Prepare context
    context = {
        **dashboard.get_revenue_impact_metrics(),
        'high_value_customers': dashboard.get_high_value_customers_at_risk(),
        'customer_segments': dashboard.get_customer_segmentation(),
    }
    
    return render_template('churn-prediction-template.html', **context)

if __name__ == '__main__':
    app.run(debug=True)
```

```bash
# 4. Run your app
python app.py

# Visit http://localhost:5000/churn
```

---

## 📊 What Your Data Needs

Your customer DataFrame should have these columns:

```python
customers = pd.DataFrame({
    'customer_id': ['C10001', 'C10002', ...],        # Required: Unique ID
    'customer_name': ['Company A', 'Company B', ...], # Required: Company name
    'monthly_revenue': [4850, 3920, ...],            # Required: Monthly $$
    'churn_probability': [0.89, 0.84, ...],          # Required: Model prediction (0-1)
    
    # Optional but recommended:
    'risk_factors': ['Low engagement, ...', ...],    # Human-readable reasons
    'contract_type': ['Enterprise', 'Basic', ...],   # Contract tier
})
```

If you don't have `churn_probability` yet:

```python
# Train a model or use your existing model
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier()
model.fit(X_train, y_train)

# Add predictions
customers['churn_probability'] = model.predict_proba(X)[:, 1]
```

---

## 🎨 What You'll See

### 1. Revenue Impact Dashboard
Four colorful metric cards showing:
- **Estimated Revenue Loss**: $214.8K annual
- **High-Value at Risk**: 5 customers
- **Total Likely to Churn**: 909 customers
- **Avg Revenue Per Customer**: $3,520

### 2. High-Value Customers Table
Lists customers most likely to churn with:
- Customer ID and company name
- Monthly revenue contribution
- Churn probability (with visual bar)
- Specific risk factors

### 3. Why Customers Churn
Bar chart showing top reasons:
- Low Engagement (32%)
- High Support Tickets (28%)
- Price Sensitivity (22%)
- Contract Length (18%)

### 4. Individual Customer Analysis
SHAP values for specific customer showing:
- Low Product Engagement (+0.48)
- Payment Delays (+0.34)
- Support Ticket Volume (+0.29)
- Contract Expiration (+0.22)

With detailed descriptions for each factor.

---

## 🎯 Minimal Download (Just Want to See It Work)

Download only these 5 files:

1. `ml-results.css`
2. `ml-tables.css`
3. `ml-charts.css`
4. `churn-prediction-template.html`
5. `complete_churn_app.py`

Then run:
```bash
pip install flask pandas numpy scikit-learn
python complete_churn_app.py
```

Visit `http://localhost:5000/churn` ✅

---

## 🔧 Customization

### Change Risk Thresholds

In `churn_prediction_helper.py`:

```python
# High risk threshold (default: 70%)
high_risk = data[data['churn_probability'] > 0.8]  # Change to 80%

# High-value threshold (default: $2,000)
high_value = dashboard.get_high_value_customers_at_risk(
    min_revenue=5000  # Change to $5,000
)
```

### Change Colors

In `ml-results.css`:

```css
/* Revenue loss card - change from red to blue */
.gradient-card.revenue-loss {
    --gradient-start: #2563eb;  /* Blue */
    --gradient-end: #1d4ed8;
}
```

---

## 📱 Features

✅ **Fully Responsive** - Works on desktop, tablet, mobile  
✅ **Clean Design** - Professional, modern aesthetic  
✅ **Fast Loading** - No heavy dependencies  
✅ **Easy to Customize** - CSS variables for quick changes  
✅ **Production Ready** - Tested and optimized  
✅ **Export Ready** - Add CSV export with one route  

---

## 🆘 Troubleshooting

### "No high-value customers showing"

**Solution:** Lower the threshold or check your data

```python
# Debug
print(customers['monthly_revenue'].describe())
print(customers['churn_probability'].describe())

# Use lower thresholds
high_value = dashboard.get_high_value_customers_at_risk(
    min_revenue=500,
    min_churn_prob=0.5
)
```

### "CSS not loading"

**Solution:** Check file paths

```python
# Flask
app = Flask(__name__, static_folder='static')

# In HTML
<link rel="stylesheet" href="/static/css/ml-results.css">
```

### "Module not found"

**Solution:** Install dependencies

```bash
pip install flask pandas numpy scikit-learn
```

---

## 📋 Checklist

**Essential Files:**
- [ ] ml-results.css
- [ ] ml-tables.css  
- [ ] ml-charts.css
- [ ] churn-prediction-template.html
- [ ] churn_prediction_helper.py

**Optional but Recommended:**
- [ ] complete_churn_app.py (working example)
- [ ] CHURN_PREDICTION_GUIDE.md (detailed guide)

**Your Data:**
- [ ] Customer data with required columns
- [ ] Churn predictions added
- [ ] Risk factors identified (optional)

---

## 🚀 What's Next?

1. **Download the files** listed above
2. **Run the example** (`complete_churn_app.py`)
3. **Replace sample data** with your real customer data
4. **Customize colors/thresholds** to match your needs
5. **Deploy to production** (Heroku, AWS, etc.)
6. **Add alerts** for high-risk customers
7. **Schedule daily updates** with APScheduler

---

## 💡 Pro Tips

1. **Start with the complete example** - Get it working first, then customize
2. **Use the helper class** - It does all the calculations for you
3. **Read the guides** - CHURN_PREDICTION_GUIDE.md has advanced tips
4. **Test with sample data** - Make sure everything works before using real data
5. **Customize gradually** - Change one thing at a time

---

## 📞 Support

Having issues?

1. **Check the guides** - CHURN_PREDICTION_GUIDE.md covers common issues
2. **Run the example** - complete_churn_app.py shows a working setup
3. **Verify data format** - Check your DataFrame has required columns
4. **Check browser console** - Look for JavaScript errors
5. **Check Flask logs** - Look for Python errors

---

## ✅ Ready to Download!

**Minimum Required (5 files):**
1. ml-results.css
2. ml-tables.css
3. ml-charts.css
4. churn-prediction-template.html
5. churn_prediction_helper.py

**Total Size:** ~60 KB

**Recommended (also download):**
6. complete_churn_app.py
7. CHURN_PREDICTION_GUIDE.md

**Total with examples:** ~90 KB

---

🎉 **You're all set! Download the files and start predicting churn!** 🚀

All files are in the `/workspaces/default/code/public/` folder.
