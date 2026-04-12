# ML Results Dashboard - Python Integration Guide

This guide explains how to integrate the ML results dashboard CSS files into your Python web application.

## 📦 Files Included

1. **ml-results.css** - Main stylesheet (layout, cards, metrics, upload section, SHAP analysis)
2. **ml-tables.css** - Model comparison table styles
3. **ml-charts.css** - Chart and visualization styles
4. **example-template.html** - Complete HTML template with usage examples

## 🚀 Quick Start

### Step 1: Download CSS Files

Download these three CSS files and place them in your project's static folder:

```
your-project/
├── static/
│   ├── css/
│   │   ├── ml-results.css
│   │   ├── ml-tables.css
│   │   └── ml-charts.css
```

### Step 2: Link CSS in Your HTML Template

Add these links in your HTML `<head>` section:

```html
<link rel="stylesheet" href="/static/css/ml-results.css">
<link rel="stylesheet" href="/static/css/ml-tables.css">
<link rel="stylesheet" href="/static/css/ml-charts.css">
```

### Step 3: Use the CSS Classes

The CSS files provide pre-built classes for all ML output components.

---

## 🎯 Usage Examples

### Flask Integration

```python
from flask import Flask, render_template
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)

@app.route('/results')
def show_results():
    # Your ML model results
    metrics = {
        'accuracy': 94.2,
        'precision': 91.8,
        'recall': 89.5,
        'f1_score': 90.6
    }
    
    models = [
        {'name': 'Random Forest', 'accuracy': 94.2, 'precision': 91.8, ...},
        {'name': 'XGBoost', 'accuracy': 92.8, 'precision': 90.2, ...},
        # ... more models
    ]
    
    confusion_matrix = {
        'true_negative': 4521,
        'false_positive': 234,
        'false_negative': 187,
        'true_positive': 3058
    }
    
    feature_importance = [
        {'name': 'Age', 'importance': 0.28},
        {'name': 'Income', 'importance': 0.24},
        # ... more features
    ]
    
    return render_template('results.html',
        metrics=metrics,
        models=models,
        confusion_matrix=confusion_matrix,
        feature_importance=feature_importance
    )
```

### Django Integration

```python
from django.shortcuts import render
from django.http import HttpResponse

def results_view(request):
    context = {
        'metrics': get_model_metrics(),
        'models': get_model_comparison(),
        'confusion_matrix': get_confusion_matrix(),
        'feature_importance': get_feature_importance(),
        'shap_values': get_shap_values()
    }
    return render(request, 'results.html', context)
```

---

## 📊 Component Documentation

### 1. Model Performance Metrics

```html
<div class="ml-metrics-grid">
    <div class="ml-metric-card">
        <div class="ml-metric-label">Accuracy</div>
        <div class="ml-metric-value">{{ metrics.accuracy }}%</div>
        <div class="ml-metric-change">+2.3% vs baseline</div>
    </div>
    <!-- Repeat for precision, recall, F1 score -->
</div>
```

**Jinja2 Template (Flask):**
```html
{% for metric_name, metric_value in metrics.items() %}
<div class="ml-metric-card">
    <div class="ml-metric-label">{{ metric_name|title }}</div>
    <div class="ml-metric-value">{{ metric_value }}%</div>
    <div class="ml-metric-change">{{ changes[metric_name] }}</div>
</div>
{% endfor %}
```

### 2. Model Comparison Table

```html
<div class="ml-table-wrapper">
    <div class="ml-card-header">
        <h2 class="ml-section-title">Model Comparison</h2>
    </div>
    
    <div class="ml-table-container">
        <table class="ml-table">
            <thead>
                <tr>
                    <th>Model</th>
                    <th class="text-right">Accuracy</th>
                    <th class="text-right">Precision</th>
                    <!-- ... more columns -->
                </tr>
            </thead>
            <tbody>
                {% for model in models %}
                <tr>
                    <td>{{ model.name }}</td>
                    <td class="text-right">{{ model.accuracy }}%</td>
                    <td class="text-right">{{ model.precision }}%</td>
                    <!-- ... more cells -->
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</div>
```

### 3. Confusion Matrix

```html
<div class="ml-confusion-matrix">
    <div class="ml-confusion-cell true-negative">
        <div class="ml-confusion-label">True Negative</div>
        <div class="ml-confusion-value">{{ cm.true_negative }}</div>
    </div>
    <div class="ml-confusion-cell false-positive">
        <div class="ml-confusion-label">False Positive</div>
        <div class="ml-confusion-value">{{ cm.false_positive }}</div>
    </div>
    <div class="ml-confusion-cell false-negative">
        <div class="ml-confusion-label">False Negative</div>
        <div class="ml-confusion-value">{{ cm.false_negative }}</div>
    </div>
    <div class="ml-confusion-cell true-positive">
        <div class="ml-confusion-label">True Positive</div>
        <div class="ml-confusion-value">{{ cm.true_positive }}</div>
    </div>
</div>
```

### 4. ROC Curve & Charts

For matplotlib/plotly charts, save them as images:

```python
# Python code to generate and save ROC curve
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve

# Generate ROC curve
fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, linewidth=2, label=f'AUC = {auc_score:.3f}')
plt.plot([0, 1], [0, 1], 'k--', linewidth=1)
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve')
plt.legend()

# Save to static folder
plt.savefig('static/images/roc_curve.png', dpi=150, bbox_inches='tight')
```

**HTML:**
```html
<div class="ml-chart-container">
    <div class="ml-chart-header">
        <h3 class="ml-chart-title">ROC Curve</h3>
        <p class="ml-chart-subtitle">AUC = {{ auc_score }}</p>
    </div>
    <div class="ml-chart-wrapper">
        <img src="/static/images/roc_curve.png" alt="ROC Curve" style="width: 100%;">
    </div>
</div>
```

### 5. Feature Importance Bar Chart

```html
<div class="ml-bar-chart">
    {% for feature in feature_importance %}
    <div class="ml-bar-item">
        <div class="ml-bar-label">{{ feature.name }}</div>
        <div class="ml-bar-track">
            <div class="ml-bar-fill" style="width: {{ feature.importance * 100 }}%;">
                <span class="ml-bar-value">{{ feature.importance|round(2) }}</span>
            </div>
        </div>
    </div>
    {% endfor %}
</div>
```

### 6. SHAP Analysis

```html
<div class="ml-shap-container">
    {% for shap in shap_values %}
    <div class="ml-shap-item">
        <div class="ml-shap-header">
            <span class="ml-shap-feature">{{ shap.feature }}</span>
            <span class="ml-shap-value">
                {{ '+' if shap.value > 0 else '' }}{{ shap.value|round(2) }}
            </span>
        </div>
        <div class="ml-shap-bar-container">
            <div class="ml-shap-bar {{ 'positive' if shap.value > 0 else 'negative' }}" 
                 style="width: {{ (shap.value|abs * 100)|round }}%;"></div>
        </div>
        <div class="ml-shap-description">{{ shap.description }}</div>
    </div>
    {% endfor %}
</div>
```

---

## 🎨 Customization

### Changing Colors

Edit the CSS variables at the top of `ml-results.css`:

```css
:root {
  --primary-color: #030213;        /* Main brand color */
  --success: #16a34a;              /* Success/positive green */
  --error: #dc2626;                /* Error/negative red */
  --chart-primary: #2563eb;        /* Primary chart color */
  --background: #fafafa;           /* Page background */
  --surface: #ffffff;              /* Card/surface color */
  --text-primary: #1a1a1a;         /* Main text color */
  --text-secondary: #717182;       /* Secondary text color */
}
```

### Responsive Design

All components are responsive by default:
- **Desktop (1400px+)**: 4-column metrics grid, 2-column visualizations
- **Tablet (768px-1024px)**: 2-column metrics grid, 1-column visualizations
- **Mobile (<768px)**: 1-column layout, stacked tables

---

## 🔧 Advanced Features

### Adding Interactive Charts with Plotly

```python
import plotly.graph_objects as go
import plotly.io as pio

# Create interactive ROC curve
fig = go.Figure()
fig.add_trace(go.Scatter(x=fpr, y=tpr, mode='lines', name='ROC Curve'))
fig.add_trace(go.Scatter(x=[0, 1], y=[0, 1], mode='lines', 
                         line=dict(dash='dash'), name='Random'))

# Convert to HTML div
plot_html = pio.to_html(fig, include_plotlyjs='cdn', div_id='roc-curve')

# Pass to template
return render_template('results.html', roc_chart=plot_html)
```

**Template:**
```html
<div class="ml-chart-container">
    <div class="ml-chart-header">
        <h3 class="ml-chart-title">ROC Curve</h3>
    </div>
    <div class="ml-chart-wrapper">
        {{ roc_chart|safe }}
    </div>
</div>
```

### Embedding Base64 Images

```python
import base64
from io import BytesIO

def get_chart_base64():
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{image_base64}"

# In your view
chart_data = get_chart_base64()
return render_template('results.html', chart_data=chart_data)
```

**Template:**
```html
<img src="{{ chart_data }}" alt="Chart" style="width: 100%;">
```

---

## 📱 Complete Flask Application Example

```python
from flask import Flask, render_template
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    # Sample data structure
    data = {
        'metrics': {
            'accuracy': 94.2,
            'precision': 91.8,
            'recall': 89.5,
            'f1_score': 90.6
        },
        'models': [
            {
                'name': 'Random Forest',
                'accuracy': 94.2,
                'precision': 91.8,
                'recall': 89.5,
                'f1_score': 90.6,
                'training_time': 2.3
            },
            {
                'name': 'XGBoost',
                'accuracy': 92.8,
                'precision': 90.2,
                'recall': 88.1,
                'f1_score': 89.1,
                'training_time': 3.7
            }
        ],
        'confusion_matrix': {
            'true_negative': 4521,
            'false_positive': 234,
            'false_negative': 187,
            'true_positive': 3058
        },
        'feature_importance': [
            {'name': 'Age', 'importance': 0.28},
            {'name': 'Income', 'importance': 0.24},
            {'name': 'Credit Score', 'importance': 0.19}
        ],
        'shap_values': [
            {'feature': 'Age', 'value': 0.42, 'description': 'Strong positive contribution'},
            {'feature': 'Income', 'value': 0.35, 'description': 'Moderate positive contribution'},
            {'feature': 'Credit Score', 'value': -0.18, 'description': 'Negative contribution'}
        ]
    }
    
    return render_template('results.html', **data)

if __name__ == '__main__':
    app.run(debug=True)
```

---

## 🐛 Troubleshooting

### CSS Not Loading?

**Flask:** Check your static folder structure:
```python
app = Flask(__name__, static_folder='static', static_url_path='/static')
```

**Django:** Add to settings.py:
```python
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
```

### Responsive Layout Issues?

Make sure you have the viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Charts Not Displaying?

Verify image paths are correct:
- Flask: Use `url_for('static', filename='images/chart.png')`
- Django: Use `{% static 'images/chart.png' %}`

---

## 📄 License

These CSS files are provided as-is for use in your ML projects. Feel free to customize and modify as needed.

## 🆘 Support

For issues or questions:
1. Check the `example-template.html` for complete usage examples
2. Verify all three CSS files are properly linked
3. Ensure your HTML classes match the CSS class names exactly

---

**Happy Coding! 🚀**
