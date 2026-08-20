import os
import httpx
from fastapi import FastAPI, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from thefuzz import process
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
        # Initialize Supabase client with user token to respect RLS
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
    """Queries NIH RxNorm for spelling suggestions and approximate matches."""
    candidates = []
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            # 1. Fetch spelling suggestions
            res_spelling = await client.get(
                f"https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name={drug_name}"
            )
            if res_spelling.status_code == 200:
                data = res_spelling.json()
                suggestions = data.get("suggestionGroup", {}).get("suggestionList", {}).get("suggestion", [])
                if suggestions:
                    candidates.extend(suggestions)

            # 2. Fetch approximate term matches for partial inputs
            res_approx = await client.get(
                f"https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term={drug_name}&maxEntries=5"
            )
            if res_approx.status_code == 200:
                data = res_approx.json()
                candidates_group = data.get("approximateGroup", {}).get("candidate", [])
                for item in candidates_group:
                    name = item.get("candidate")
                    if name:
                        candidates.append(name)
    except Exception as e:
        print(f"[RxNorm API] Candidate lookup error: {e}")

    return list(set(candidates))

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
        return {"normalized_name": "", "score": 0}

    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]

    # Fetch candidate sources dynamically
    user_db_drugs = await get_user_history(token) if token else []
    rxnorm_drugs = await get_rxnorm_candidates(clean_name)

    # 1. Priority Check: Match directly against user's DB scan history
    if user_db_drugs:
        match, score = process.extractOne(clean_name, user_db_drugs)
        if score >= 65 and match.lower() != clean_name.lower():
            return {"normalized_name": match, "score": score, "source": "user_history"}

    # 2. Second Check: Match against NIH RxNorm validated medical terms
    if rxnorm_drugs:
        match, score = process.extractOne(clean_name, rxnorm_drugs)
        if score >= 70 and match.lower() != clean_name.lower():
            return {"normalized_name": match, "score": score, "source": "rxnorm"}

    return {"normalized_name": clean_name, "score": 0, "source": "none"}

@app.post("/normalize")
async def normalize_drug_post(
    request: DrugRequest,
    authorization: Optional[str] = Header(None)
):
    return await normalize_drug_get(request.name, authorization)