from fastapi import FastAPI
from pydantic import BaseModel
from thefuzz import process

app = FastAPI()

# A mock database of common drugs for our fuzzy logic to check against
COMMON_DRUGS = [
    "Aspirin", "Ibuprofen", "Lisinopril", "Metformin", "Atorvastatin",
    "Amoxicillin", "Levothyroxine", "Warfarin", "Omeprazole", "Losartan"
]

# This defines the shape of the data we expect from Node.js
class DrugRequest(BaseModel):
    name: str

@app.post("/normalize")
async def normalize_drug(request: DrugRequest):
    # process.extractOne compares the messy input against our clean list
    # It returns the best match and a score out of 100
    best_match, score = process.extractOne(request.name, COMMON_DRUGS)
    
    # We only accept the fix if it is at least 85% confident
    if score > 85:
        return {"normalized_name": best_match, "score": score}
    else:
        return {"normalized_name": None, "score": score}