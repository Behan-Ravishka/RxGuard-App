import os
import asyncio
import httpx
from fastapi import FastAPI, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from thefuzz import process, fuzz
from supabase import create_client, Client
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RxGuard Drug Normalizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

class DrugRequest(BaseModel):
    name: str

async def get_user_history(token: str) -> list[str]:
    """Fetches unique saved drugs from the user's Supabase scan history."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not token:
        return []
    
    try:
        supabase: Client = create_client(
            SUPABASE_URL, 
            SUPABASE_ANON_KEY,
            options={"headers": {"Authorization": f"Bearer {token}"}}
        )
        
        response = supabase.table("scan_history").select("drugs_detected").execute()
        
        unique_drugs = set()
        for record in response.data:
            drugs = record.get("drugs_detected", [])
            if isinstance(drugs, list):
                for drug in drugs:
                    if drug and isinstance(drug, str):
                        unique_drugs.add(drug.strip().title())
        return list(unique_drugs)
    except Exception as e:
        print(f"[Supabase Normalizer] History fetch error: {e}")
        return []

async def get_rxnorm_candidates(drug_name: str) -> list[str]:
    """Queries NIH RxNorm concurrently for spelling suggestions and approximate matches."""
    candidates = set()
    
    # Run both API calls at the same time to halve the network waiting time
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            req_spell = client.get(f"https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name={drug_name}")
            req_approx = client.get(f"https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term={drug_name}&maxEntries=5")
            
            res_spell, res_approx = await asyncio.gather(req_spell, req_approx, return_exceptions=True)
            
            # Process Spelling Results
            if isinstance(res_spell, httpx.Response) and res_spell.status_code == 200:
                data = res_spell.json()
                suggestions = data.get("suggestionGroup", {}).get("suggestionList", {}).get("suggestion", [])
                if suggestions:
                    candidates.update(suggestions)
                    
            # Process Approximate Results
            if isinstance(res_approx, httpx.Response) and res_approx.status_code == 200:
                data = res_approx.json()
                candidates_group = data.get("approximateGroup", {}).get("candidate", [])
                for item in candidates_group:
                    if name := item.get("candidate"):
                        candidates.add(name)
                        
        except Exception as e:
            print(f"[RxNorm API] Candidate lookup error: {e}")

    return list(candidates)

@app.get("/")
async def root():
    return {"status": "online", "message": "RxGuard Python Normalizer is running!"}

@app.get("/normalize")
async def normalize_drug_get(
    drug_name: str = Query(..., alias="drug_name"),
    authorization: Optional[str] = Header(None)
):
    clean_name = drug_name.strip()
    if len(clean_name) < 2:
        return {"normalized_name": "", "score": 0, "source": "none", "is_correction": False}

    token = authorization.split(" ")[1] if authorization and authorization.startswith("Bearer ") else ""

    # Fetch candidates
    user_db_drugs = await get_user_history(token) if token else []
    rxnorm_drugs = await get_rxnorm_candidates(clean_name)
    
    # 0. Check for EXACT matches first to save processing time and ensure 100% accuracy
    if clean_name.lower() in [d.lower() for d in rxnorm_drugs]:
        # Capitalize based on the database version
        exact_match = next(d for d in rxnorm_drugs if d.lower() == clean_name.lower())
        return {"normalized_name": exact_match, "score": 100, "source": "rxnorm", "is_correction": False}
        
    if clean_name.lower() in [d.lower() for d in user_db_drugs]:
        exact_match = next(d for d in user_db_drugs if d.lower() == clean_name.lower())
        return {"normalized_name": exact_match, "score": 100, "source": "user_history", "is_correction": False}

    # 1. Fuzzy Match against User History
    if user_db_drugs:
        match, score = process.extractOne(clean_name, user_db_drugs, scorer=fuzz.token_sort_ratio)
        if score >= 70:
            return {
                "normalized_name": match, 
                "score": score, 
                "source": "user_history",
                "is_correction": match.lower() != clean_name.lower()
            }

    # 2. Fuzzy Match against NIH RxNorm
    if rxnorm_drugs:
        match, score = process.extractOne(clean_name, rxnorm_drugs, scorer=fuzz.token_sort_ratio)
        if score >= 70:
            return {
                "normalized_name": match, 
                "score": score, 
                "source": "rxnorm",
                "is_correction": match.lower() != clean_name.lower()
            }

    # Fallback
    return {"normalized_name": clean_name.title(), "score": 0, "source": "none", "is_correction": False}

@app.post("/normalize")
async def normalize_drug_post(
    request: DrugRequest,
    authorization: Optional[str] = Header(None)
):
    return await normalize_drug_get(request.name, authorization)