import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

# 🛠️ THE FIX: Explicitly tell it which database to use!
# Note: If your database in MongoDB Atlas is named something else 
# (like "retailiq"), change "test" to that name.
db = client["test"] 

orders_collection = db["orders"]