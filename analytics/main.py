from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from database import orders_collection
from ml_service import generate_sales_insights
from bson.objectid import ObjectId
from bson.errors import InvalidId
import traceback

app = FastAPI()

# 🛠️ Broaden CORS to catch all local port variations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "RetailIQ Analytics Microservice is running!"}

@app.get("/api/analytics/{shop_id}")
def get_analytics(shop_id: str, timeframe: str = Query("monthly")):
    try:
        # Safely attempt to convert the string to a MongoDB ObjectId
        try:
            shop_object_id = ObjectId(shop_id)
        except InvalidId:
            return {"success": False, "message": "Invalid Shop ID format"}

        query = {"shopId": shop_object_id, "paymentStatus": "paid"}
        
        # Fetch orders
        orders = list(orders_collection.find(query, {"_id": 0, "totalAmount": 1, "createdAt": 1, "items": 1}))
        
        # Generate insights
        insights = generate_sales_insights(orders, timeframe)
        
        return {"success": True, "data": insights}
        
    except Exception as e:
        # 🔥 Prevent Phantom CORS! Print the exact error and return it safely to frontend.
        print("🔥 BACKEND CRASH 🔥")
        traceback.print_exc() 
        return {"success": False, "message": f"Python Error: {str(e)}"}