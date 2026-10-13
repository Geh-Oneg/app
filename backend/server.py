from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta


# MongoDB
print("TESTE_BACKEND:", os.getenv("TESTE_BACKEND"), flush=True)
print("MONGODB_URI presente:", bool(os.getenv("MONGODB_URI")), flush=True)

mongo_url = os.environ["MONGODB_URI"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24
VALID_STATUSES = ["Pendente", "Em Análise", "Em Manutenção", "Concluída", "Rejeitada"]
VALID_ROLES = ["motorista", "supervisor"]

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ---------------- Helpers ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, matricula: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "matricula": matricula,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    if not user.get("approved", False):
        raise HTTPException(status_code=403, detail="Usuário aguardando aprovação do supervisor")
    return user


async def require_supervisor(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "supervisor":
        raise HTTPException(status_code=403, detail="Acesso restrito ao supervisor")
    return user


# ---------------- Models ----------------
class RegisterInput(BaseModel):
    matricula: str
    name: str
    password: str
    role: str = "motorista"


class LoginInput(BaseModel):
    matricula: str
    password: str


class VehicleInput(BaseModel):
    plate: str
    model: str
    description: Optional[str] = ""


class OSCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    vehicle_plate: str
    vehicle_model: str
    km: int
    description: str
    urgency: Optional[str] = "Média"


class OSUpdateStatus(BaseModel):
    status: str
    supervisor_notes: Optional[str] = ""


class UserApprove(BaseModel):
    approved: bool
    role: Optional[str] = None


class ChangePasswordInput(BaseModel):
    current_password: str
    new_password: str


class ChangeProfileInput(BaseModel):
    name: Optional[str] = None
    current_password: str
    new_password: Optional[str] = None


class ForgotPasswordInput(BaseModel):
    matricula: str
    reason: Optional[str] = ""


class ResetPasswordInput(BaseModel):
    new_password: str


# ---------------- App Setup ----------------
app = FastAPI()
api_router = APIRouter(prefix="/api")


@app.on_event("startup")
async def startup():
    await db.users.create_index("matricula", unique=True)
    await db.vehicles.create_index("plate", unique=True)
    await db.service_orders.create_index("os_number", unique=True)
    await seed_admin()


async def seed_admin():
    matricula = os.environ["ADMIN_MATRICULA"]
    password = os.environ["ADMIN_PASSWORD"]
    name = os.environ["ADMIN_NAME"]
    existing = await db.users.find_one({"matricula": matricula})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "matricula": matricula,
            "name": name,
            "password_hash": hash_password(password),
            "role": "supervisor",
            "approved": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {matricula}")
   

async def generate_os_number() -> str:
    year = datetime.now(timezone.utc).year
    count = await db.service_orders.count_documents({"os_number": {"$regex": f"^OS-{year}-"}})
    return f"OS-{year}-{str(count + 1).zfill(4)}"


def clean_user(u: dict) -> dict:
    u.pop("_id", None)
    u.pop("password_hash", None)
    return u


# ---------------- Auth Routes ----------------
@api_router.post("/auth/register")
async def register(data: RegisterInput):
    matricula = data.matricula.strip().upper()
    if not matricula or not data.password or not data.name:
        raise HTTPException(status_code=400, detail="Preencha todos os campos")
    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Função inválida")
    existing = await db.users.find_one({"matricula": matricula})
    if existing:
        raise HTTPException(status_code=400, detail="Matrícula já cadastrada")
    user = {
        "id": str(uuid.uuid4()),
        "matricula": matricula,
        "name": data.name.strip(),
        "password_hash": hash_password(data.password),
        "role": data.role,
        "approved": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    return {"message": "Cadastro recebido. Aguarde aprovação do supervisor.", "user": clean_user(dict(user))}


@api_router.post("/auth/login")
async def login(data: LoginInput):
    matricula = data.matricula.strip().upper()
    user = await db.users.find_one({"matricula": matricula})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Matrícula ou senha incorretos")
    if not user.get("approved", False):
        raise HTTPException(status_code=403, detail="Cadastro aguardando aprovação do supervisor")
    token = create_access_token(user["id"], user["matricula"], user["role"])
    return {"token": token, "user": clean_user(dict(user))}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.put("/auth/profile")
async def update_profile(data: ChangeProfileInput, user: dict = Depends(get_current_user)):
    current = await db.users.find_one({"id": user["id"]})
    if not current or not verify_password(data.current_password, current["password_hash"]):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    update = {}
    if data.name and data.name.strip():
        update["name"] = data.name.strip()
    if data.new_password:
        if len(data.new_password) < 4:
            raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 4 caracteres")
        update["password_hash"] = hash_password(data.new_password)
    if not update:
        raise HTTPException(status_code=400, detail="Nenhuma alteração enviada")
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated


@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordInput):
    matricula = data.matricula.strip().upper()
    user = await db.users.find_one({"matricula": matricula})
    # Always return success-like response to avoid leaking which matriculas exist
    if user:
        existing = await db.password_resets.find_one({"user_id": user["id"], "status": "pending"})
        if not existing:
            await db.password_resets.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "matricula": user["matricula"],
                "user_name": user["name"],
                "reason": (data.reason or "").strip()[:300],
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    return {"message": "Se a matrícula existir, o supervisor receberá sua solicitação de recuperação."}


# ---------------- Password Resets (Supervisor) ----------------
@api_router.get("/password-resets")
async def list_resets(_: dict = Depends(require_supervisor), status: Optional[str] = "pending"):
    query = {} if status == "all" else {"status": status}
    items = await db.password_resets.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.post("/password-resets/{reset_id}/approve")
async def approve_reset(reset_id: str, data: ResetPasswordInput, supervisor: dict = Depends(require_supervisor)):
    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="Senha temporária precisa ter pelo menos 4 caracteres")
    reset = await db.password_resets.find_one({"id": reset_id})
    if not reset:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    if reset.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Solicitação já tratada")
    await db.users.update_one(
        {"id": reset["user_id"]},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    await db.password_resets.update_one(
        {"id": reset_id},
        {"$set": {
            "status": "approved",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "resolved_by": supervisor["name"],
            "temp_password": data.new_password,
        }}
    )
    updated = await db.password_resets.find_one({"id": reset_id}, {"_id": 0})
    return updated


@api_router.post("/password-resets/{reset_id}/reject")
async def reject_reset(reset_id: str, supervisor: dict = Depends(require_supervisor)):
    reset = await db.password_resets.find_one({"id": reset_id})
    if not reset:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    await db.password_resets.update_one(
        {"id": reset_id},
        {"$set": {
            "status": "rejected",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "resolved_by": supervisor["name"],
        }}
    )
    return {"ok": True}


# ---------------- Users (Admin) ----------------
@api_router.get("/users")
async def list_users(_: dict = Depends(require_supervisor), approved: Optional[bool] = None):
    query = {} if approved is None else {"approved": approved}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return users


@api_router.patch("/users/{user_id}")
async def update_user(user_id: str, data: UserApprove, _: dict = Depends(require_supervisor)):
    update = {"approved": data.approved}
    if data.role and data.role in VALID_ROLES:
        update["role"] = data.role
    result = await db.users.update_one({"id": user_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return user


@api_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    password: str = Query(...),
    current: dict = Depends(require_supervisor)
):
    if current["id"] == user_id:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir a si mesmo"
        )

    supervisor = await db.users.find_one({"id": current["id"]})

    if not supervisor or not verify_password(
        password, supervisor["password_hash"]
    ):
        raise HTTPException(
            status_code=403,
            detail="Senha do supervisor incorreta"
        )

    result = await db.users.delete_one({"id": user_id})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    return {"ok": True}

# ---------------- Vehicles ----------------
@api_router.get("/vehicles")
async def list_vehicles(_: dict = Depends(get_current_user)):
    vehicles = await db.vehicles.find({}, {"_id": 0}).sort("plate", 1).to_list(500)
    return vehicles


@api_router.post("/vehicles")
async def create_vehicle(data: VehicleInput, _: dict = Depends(require_supervisor)):
    plate = data.plate.strip().upper()
    if await db.vehicles.find_one({"plate": plate}):
        raise HTTPException(status_code=400, detail="Placa já cadastrada")
    vehicle = {
        "id": str(uuid.uuid4()),
        "plate": plate,
        "model": data.model.strip(),
        "description": data.description or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.vehicles.insert_one(vehicle)
    vehicle.pop("_id", None)
    return vehicle


@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, _: dict = Depends(require_supervisor)):
    await db.vehicles.delete_one({"id": vehicle_id})
    return {"ok": True}


# ---------------- Service Orders ----------------
@api_router.post("/service-orders")
async def create_os(data: OSCreate, user: dict = Depends(get_current_user)):
    if data.km < 0:
        raise HTTPException(status_code=400, detail="KM inválido")
    os_number = await generate_os_number()
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "os_number": os_number,
        "created_at": now,
        "updated_at": now,
        "driver_id": user["id"],
        "driver_matricula": user["matricula"],
        "driver_name": user["name"],
        "vehicle_plate": data.vehicle_plate.strip().upper(),
        "vehicle_model": data.vehicle_model.strip(),
        "km": data.km,
        "urgency": data.urgency or "Média",
        "description": data.description.strip(),
        "status": "Pendente",
        "supervisor_notes": "",
        "status_history": [{"status": "Pendente", "at": now, "by": user["name"]}],
    }
    await db.service_orders.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/service-orders")
async def list_os(
    user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    plate: Optional[str] = None,
    driver: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
):
    query: dict = {}
    if user["role"] == "motorista":
        query["driver_id"] = user["id"]
    if status:
        query["status"] = status
    if plate:
        query["vehicle_plate"] = {"$regex": plate.upper(), "$options": "i"}
    if driver:
        query["$or"] = [
            {"driver_name": {"$regex": driver, "$options": "i"}},
            {"driver_matricula": {"$regex": driver.upper(), "$options": "i"}},
        ]
    if date_from or date_to:
        rng = {}
        if date_from:
            rng["$gte"] = date_from
        if date_to:
            rng["$lte"] = date_to + "T23:59:59"
        query["created_at"] = rng
    if search:
        query["$or"] = [
            {"os_number": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"vehicle_plate": {"$regex": search.upper(), "$options": "i"}},
        ]
    orders = await db.service_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders


@api_router.get("/service-orders/{os_id}")
async def get_os(os_id: str, user: dict = Depends(get_current_user)):
    order = await db.service_orders.find_one({"id": os_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    if user["role"] == "motorista" and order["driver_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return order


@api_router.patch("/service-orders/{os_id}")
async def update_os_status(os_id: str, data: OSUpdateStatus, user: dict = Depends(require_supervisor)):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Status inválido")
    order = await db.service_orders.find_one({"id": os_id})
    if not order:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    now = datetime.now(timezone.utc).isoformat()
    history = order.get("status_history", [])
    history.append({"status": data.status, "at": now, "by": user["name"], "notes": data.supervisor_notes or ""})
    await db.service_orders.update_one(
        {"id": os_id},
        {"$set": {
            "status": data.status,
            "supervisor_notes": data.supervisor_notes or order.get("supervisor_notes", ""),
            "updated_at": now,
            "status_history": history,
        }}
    )
    updated = await db.service_orders.find_one({"id": os_id}, {"_id": 0})
    return updated


@api_router.get("/stats")
async def stats(user: dict = Depends(get_current_user)):
    base: dict = {}
    if user["role"] == "motorista":
        base["driver_id"] = user["id"]
    total = await db.service_orders.count_documents(base)
    by_status = {}
    for s in VALID_STATUSES:
        by_status[s] = await db.service_orders.count_documents({**base, "status": s})
    pending_users = 0
    pending_resets = 0
    if user["role"] == "supervisor":
        pending_users = await db.users.count_documents({"approved": False})
        pending_resets = await db.password_resets.count_documents({"status": "pending"})
    return {"total": total, "by_status": by_status, "pending_users": pending_users, "pending_resets": pending_resets}


# ---------------- Register & CORS ----------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
