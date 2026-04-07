import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def generate_sales_insights(orders_data, timeframe):
    if not orders_data:
        return {
            "chart_data": [], "prediction": 0, "trend": "flat", 
            "suggestion": "No sales data available yet.", "top_selling": [], "action_needed": []
        }

    df = pd.DataFrame(orders_data)
    
    # 🛠️ BUG FIX 1: Strip timezones from MongoDB dates so .to_period() never crashes
    df['createdAt'] = pd.to_datetime(df['createdAt']).dt.tz_localize(None)
    
    time_map = {"daily": "D", "weekly": "W", "monthly": "M", "quarterly": "Q", "yearly": "Y"}
    period = time_map.get(timeframe, "M")

    # Group Sales Data
    grouped = df.groupby(df['createdAt'].dt.to_period(period))['totalAmount'].sum().reset_index()
    grouped['createdAt'] = grouped['createdAt'].astype(str)
    chart_data = grouped.rename(columns={'createdAt': 'time', 'totalAmount': 'sales'}).to_dict(orient="records")

    # Extract Product Intelligence
    product_sales = {}
    if 'items' in df.columns:
        for items_list in df['items'].dropna():
            if isinstance(items_list, list):
                for item in items_list:
                    name = item.get('name', 'Unknown')
                    qty = item.get('quantity', 0)
                    product_sales[name] = product_sales.get(name, 0) + qty

    sorted_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)
    
    # 🛠️ BUG FIX 2: Ensure quantities are cast to standard int
    top_selling = [{"name": k, "qty": int(v)} for k, v in sorted_products[:3]]
    
    action_needed = []
    if len(sorted_products) > 3:
        threshold = sorted_products[0][1] * 0.2 
        action_needed = [{"name": k, "qty": int(v)} for k, v in sorted_products[-3:] if v <= threshold]

    prediction, trend, suggestion = 0.0, "flat", "Keep selling to unlock trend predictions!"
    
    if len(grouped) >= 2:
        X = np.arange(len(grouped)).reshape(-1, 1)
        y = grouped['totalAmount'].values
        model = LinearRegression()
        model.fit(X, y)
        
        next_idx = np.array([[len(grouped)]])
        
        # 🛠️ BUG FIX 3: Cast the Numpy float64 output to standard Python float
        pred_val = model.predict(next_idx)[0]
        prediction = float(max(0, pred_val)) 
        
        trend = "up" if model.coef_[0] > 0 else "down"
        top_item_name = top_selling[0]['name'] if top_selling else "your top products"
        
        if trend == "up":
            suggestion = f"Momentum is building! Ensure '{top_item_name}' is heavily stocked to capture upcoming demand."
        else:
            suggestion = f"Sales are softening. Consider running a flash sale on slow-moving inventory to inject cashflow."
            
    elif len(grouped) == 1:
        # Cast the single value to float
        prediction = float(grouped['totalAmount'].iloc[0]) 

    return {
        "chart_data": chart_data,
        "prediction": round(prediction, 2),
        "trend": trend,
        "suggestion": suggestion,
        "top_selling": top_selling,
        "action_needed": action_needed
    }