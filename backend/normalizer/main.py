from fastapi import FastAPI, Query
from pydantic import BaseModel
from thefuzz import process

app = FastAPI(title="RxGuard Drug Normalizer")

COMMON_DRUGS = [
    "Aspirin", "Ibuprofen", "Lisinopril", "Metformin", "Atorvastatin",
    "Amoxicillin", "Levothyroxine", "Warfarin", "Omeprazole", "Losartan",
    "Paracetamol", "Acetaminophen", "Atorvastatin Calcium", "Glimepiride",
    "Sitagliptin", "Avitene"
]

class DrugRequest(BaseModel):
    name: str

@app.get("/")
async def root():
    return {"status": "online", "message": "RxGuard Python Normalizer is running!"}

# Handles GET requests sent by Node.js backend (/normalize?drug_name=...)
@app.get("/normalize")
async def normalize_drug_get(drug_name: str = Query(..., alias="drug_name")):
    best_match, score = process.extractOne(drug_name, COMMON_DRUGS)
    if score > 85:
        return {"normalized_name": best_match, "score": score}
    return {"normalized_name": drug_name, "score": score}

# Handles POST requests sent with JSON bodies
@app.post("/normalize")
async def normalize_drug_post(request: DrugRequest):
    best_match, score = process.extractOne(request.name, COMMON_DRUGS)
    if score > 85:
        return {"normalized_name": best_match, "score": score}
    return {"normalized_name": request.name, "score": score}