from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import shutil
import os
from pathlib import Path
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # ADD THIS IMPORT
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import shutil
import os
from pathlib import Path
import uuid
import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from livekit import api
import os
import base64
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import engine, Base, get_db

# Import our new database files
from database import engine, Base, get_db
import models
import models

Base.metadata.create_all(bind=engine)

security = HTTPBearer()

# HELPER FUNCTION TO GET CURRENT VIEWER
def get_current_viewer(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        # Token decode karein
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Security Check: Sirf Viewers tip kar sakte hain
        if payload.get("role") != "viewer":
            raise HTTPException(status_code=403, detail="Only viewers can tip models.")
            
        # Database se viewer nikalein
        viewer = db.query(models.Viewer).filter(models.Viewer.id == payload.get("user_id")).first()
        if not viewer:
            raise HTTPException(status_code=404, detail="Viewer account not found.")
            
        return viewer
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

app = FastAPI(title="Nirochart API")
SECRET_KEY = "nirochart-super-secret-key-change-this-in-production"
ALGORITHM = "HS256"

class ThumbnailData(BaseModel):
    room_id: str
    image: str  # Base64 string from frontend

# Create a Pydantic schema for incoming login data
class LoginRequest(BaseModel):
    email: str
    password: str

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ViewerSignupRequest(BaseModel):
    username: str
    email: str
    password: str

class ViewerLoginRequest(BaseModel):
    email: str
    password: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "https://nirochartlive-web.onrender.com"
                   ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Nirochart API is live and running!"}

UPLOAD_DIR = Path("uploads/kyc_documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

THUMBNAIL_DIR = Path("uploads/thumbnails")
THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)

# 1. MOUNT THE UPLOADS FOLDER SO IMAGES CAN BE VIEWED
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

LIVEKIT_API_KEY = "APIQHGEBbFJu6oh"
LIVEKIT_API_SECRET = "jBarsOX5jlVqpLsnPl6yS3YC5yMMMBdsk7QLVmf26XZ"
LIVEKIT_URL = "wss://fastchat-sxbx8466.livekit.cloud"

@app.post("/api/models/apply")
async def apply_for_model(
    # Text Data
    email: str = Form(...),
    password: str = Form(...),
    displayName: str = Form(...),
    dob: str = Form(...),
    bodyType: str = Form(...),
    interests: str = Form(...),
    
    # File Data
    idFront: UploadFile = File(...),
    idBack: UploadFile = File(...),
    selfie: UploadFile = File(...),
    
    # Database Session Dependency
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing_user = db.query(models.ModelApplication).filter(models.ModelApplication.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    try:
        applicant_id = str(uuid.uuid4())
        applicant_dir = UPLOAD_DIR / applicant_id
        applicant_dir.mkdir(exist_ok=True)

        def save_upload_file(upload_file: UploadFile, destination: Path):
            with destination.open("wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
            return str(destination)

        # Save files and get their paths
        front_path = save_upload_file(idFront, applicant_dir / f"id_front_{idFront.filename}")
        back_path = save_upload_file(idBack, applicant_dir / f"id_back_{idBack.filename}")
        selfie_path = save_upload_file(selfie, applicant_dir / f"selfie_{selfie.filename}")

        # Hash the password securely
        hashed_password = pwd_context.hash(password[:72])

        # Create the new database record
        new_application = models.ModelApplication(
            email=email,
            password_hash=hashed_password,
            display_name=displayName,
            dob=dob,
            body_type=bodyType,
            interests=interests,
            id_front_path=front_path,
            id_back_path=back_path,
            selfie_path=selfie_path,
            status="pending"
        )

        # Add and commit to the database
        db.add(new_application)
        db.commit()
        db.refresh(new_application)

        return {
            "status": "success", 
            "message": "Application received and saved securely.",
            "application_id": new_application.id
        }

    except Exception as e:
        db.rollback() # Important: rollback if anything fails
        raise HTTPException(status_code=500, detail=f"Failed to process application: {str(e)}")
    
# 2. ADD ADMIN ENDPOINT TO GET PENDING APPLICATIONS
@app.get("/api/admin/applications")
def get_pending_applications(db: Session = Depends(get_db)):
    applications = db.query(models.ModelApplication).filter(models.ModelApplication.status == "pending").all()
    return applications

# 3. ADD ADMIN ENDPOINT TO APPROVE OR REJECT
@app.put("/api/admin/applications/{app_id}/{action}")
def review_application(app_id: int, action: str, db: Session = Depends(get_db)):
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    application = db.query(models.ModelApplication).filter(models.ModelApplication.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = "approved" if action == "approve" else "rejected"
    db.commit()

    return {"status": "success", "message": f"Application {action}d successfully"} 

# --- ADD THE LOGIN ENDPOINT ---
@app.post("/api/models/login")
def login_model(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find the user by email
    user = db.query(models.ModelApplication).filter(models.ModelApplication.email == request.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # 2. Verify the hashed password
    if not pwd_context.verify(request.password[:72], user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # 3. Check Admin Approval Status
    if user.status == "pending":
        raise HTTPException(status_code=403, detail="Your account is still pending admin approval.")
    if user.status == "rejected":
        raise HTTPException(status_code=403, detail="Your application was rejected by the admin.")

    # 4. Generate JWT Token
    expiration = datetime.utcnow() + timedelta(hours=24)
    
    token_payload = {
        "sub": user.email,
        "user_id": user.id,
        "display_name": user.display_name,
        "exp": expiration
    }
    
    token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": {
            "id": user.id,
            "display_name": user.display_name
        }
    }   


    
# --- Add the Token Endpoint ---
@app.get("/api/room/token")
def get_livekit_token(
    room_name: str,
    participant_name: str,
    is_model: bool = False,
    db: Session = Depends(get_db)
):

    # Normalize room name
    room_name = room_name.replace(" ", "_").lower()

    # Only verify model users
    if is_model:
        user = db.query(models.ModelApplication).filter(
            models.ModelApplication.display_name == participant_name
        ).first()

        if not user:
            raise HTTPException(status_code=404, detail="Model not found")

    grant = api.VideoGrants(
        room_join=True,
        room=room_name
    )

    if is_model:
        grant.canPublish = True
        grant.canPublishData = True
        grant.canSubscribe = True
    else:
        grant.canPublish = False
        grant.canPublishData = True
        grant.canSubscribe = True

    access_token = api.AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET
    )

    access_token.with_identity(participant_name)\
                .with_name(participant_name)\
                .with_grants(grant)

    return {
        "token": access_token.to_jwt(),
        "room_name": room_name
    }

@app.post("/api/room/thumbnail")
def update_stream_thumbnail(data: ThumbnailData, db: Session = Depends(get_db)):
    try:
        # Decode image
        header, encoded = data.image.split(",", 1)
        image_data = base64.b64decode(encoded)

        # Normalize room id
        room_id = data.room_id.replace(" ", "_").lower()

        # Save thumbnail
        file_path = THUMBNAIL_DIR / f"{room_id}.jpg"

        with open(file_path, "wb") as f:
            f.write(image_data)
        
        BASE_URL = os.getenv("RENDER_EXTERNAL_URL", "${import.meta.env.VITE_API_URL}")
        thumbnail_url = f"{BASE_URL}/uploads/thumbnails/{data.room_id}.jpg"

        # Existing stream check
        stream = db.query(models.LiveStream).filter(
            models.LiveStream.room_id == room_id
        ).first()

        if stream:
            stream.thumbnail_url = thumbnail_url
            stream.last_heartbeat = datetime.utcnow()
            stream.is_live = True

        else:
            display_name = room_id.replace("_", " ").title()

            stream = models.LiveStream(
                room_id=room_id,
                display_name=display_name,
                stream_title=f"{display_name} is Live!",
                thumbnail_url=thumbnail_url,
                is_live=True,
                last_heartbeat=datetime.utcnow()
            )

            db.add(stream)

        # VERY IMPORTANT
        db.commit()

        return {"status": "success"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# --- 5. ENDPOINT: GET ALL ACTIVE STREAMS FOR HOME PAGE ---
@app.get("/api/streams/live")
def get_active_streams(db: Session = Depends(get_db)):
    # Heartbeat logic: Current time se 2 minute pehle ka time nikal lo
    cutoff_time = datetime.utcnow() - timedelta(minutes=2)

    # Sirf wo streams fetch karo jo last 2 minutes me update hui hain (Taki offline models hat jaye)
    active_streams = db.query(models.LiveStream).filter(
        models.LiveStream.is_live == True,
        models.LiveStream.last_heartbeat > cutoff_time
    ).all()

    return active_streams

@app.post("/api/streams/end/{room_id}")
def end_stream(room_id: str, db: Session = Depends(get_db)):
    # Find the CURRENT live stream for this room
    stream = db.query(models.LiveStream).filter(
        models.LiveStream.room_id == room_id, 
        models.LiveStream.is_live == True
    ).first()
    
    if stream:
        stream.is_live = False
        stream.end_time = datetime.utcnow() # Record end time
        db.commit()
        return {"status": "success", "message": "Stream ended"}
    
    raise HTTPException(status_code=404, detail="Active stream not found")

@app.post("/api/viewers/signup")
def signup_viewer(request: ViewerSignupRequest, db: Session = Depends(get_db)):
    # Check if email or username already exists
    existing_user = db.query(models.Viewer).filter(
        (models.Viewer.email == request.email) | (models.Viewer.username == request.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or Username already taken")

    # Hash password and create user
    hashed_password = pwd_context.hash(request.password)
    new_viewer = models.Viewer(
        username=request.username,
        email=request.email,
        password_hash=hashed_password,
        wallet_balance=100 # Giving 100 free welcome coins for testing!
    )
    
    db.add(new_viewer)
    db.commit()
    db.refresh(new_viewer)
    
    return {"status": "success", "message": "Viewer account created!"}


@app.post("/api/viewers/login")
def login_viewer(request: ViewerLoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Viewer).filter(models.Viewer.email == request.email).first()
    
    if not user or not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Generate JWT Token (Role: Viewer)
    expiration = datetime.utcnow() + timedelta(hours=24)
    token_payload = {
        "sub": user.email,
        "user_id": user.id,
        "username": user.username,
        "role": "viewer", # Important to distinguish from models
        "exp": expiration
    }
    token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": token, 
        "user": {
            "id": user.id,
            "username": user.username,
            "wallet_balance": user.wallet_balance
        }
    }


# Tipping ka schema
class TipRequest(BaseModel):
    room_id: str  # Ye actually model ka id hai humare architecture me
    amount: int

@app.post("/api/tips/send")
def send_tip(
    request: TipRequest, 
    viewer: models.Viewer = Depends(get_current_viewer), 
    db: Session = Depends(get_db)
):
    # 1. Validation
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Tip amount must be greater than zero.")
        
    if viewer.wallet_balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient coins in your wallet.")

    # 2. Find the Model
    model = db.query(models.ModelApplication).filter(models.ModelApplication.id == int(request.room_id)).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found.")

    try:
        # 3. DEDUCT from Viewer
        viewer.wallet_balance -= request.amount
        
        # 4. ADD to Model
        model.wallet_balance += request.amount
        
        # 5. CREATE Transaction Record
        transaction = models.TipTransaction(
            viewer_id=viewer.id,
            model_id=model.id,
            amount=request.amount
        )
        db.add(transaction)
        
        # 6. SAVE Everything at once (Atomic Transaction)
        db.commit()
        
        return {
            "status": "success", 
            "message": f"Successfully tipped {request.amount} coins!",
            "new_balance": viewer.wallet_balance
        }
        
    except Exception as e:
        # Agar beech me database me koi problem aayi, toh sab kuch wapas normal kar do
        db.rollback()
        raise HTTPException(status_code=500, detail="Transaction failed. Please try again.")
    
    
# --- 1. Helper function for Model Security ---
# Ye check karega ki request karne wala sach me ek logged-in Model hai
def get_current_model(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        # Database se model ko dhundhe
        model = db.query(models.ModelApplication).filter(models.ModelApplication.id == user_id).first()
        if not model:
            raise HTTPException(status_code=404, detail="Model account not found.")
            
        return model
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

# --- 2. Endpoint to Get Profile & Earnings ---
@app.get("/api/models/profile")
def get_model_profile(current_model: models.ModelApplication = Depends(get_current_model)):
    # Hum password chhod kar baaki saari details frontend ko bhejenge
    return {
        "id": current_model.id,
        "display_name": current_model.display_name,
        "wallet_balance": current_model.wallet_balance,
        "body_type": current_model.body_type,
        "status": current_model.status
    }
    
    
# --- ENDPOINT: GET VIEWER PROFILE ---
@app.get("/api/viewers/profile")
def get_viewer_profile(current_viewer: models.Viewer = Depends(get_current_viewer)):
    # Password hash kabhi frontend pe nahi bhejte
    return {
        "id": current_viewer.id,
        "username": current_viewer.username,
        "email": current_viewer.email,
        "wallet_balance": current_viewer.wallet_balance
    }
    
# --- EPOCH PAYMENT ENDPOINTS ---

class BuyCoinRequest(BaseModel):
    coins: int
    price_usd: float

@app.post("/api/payments/create-epoch-session")
def create_epoch_session(request: BuyCoinRequest, current_viewer: models.Viewer = Depends(get_current_viewer)):
    # Ye details aapko apne Epoch Merchant Account se milengi
    EPOCH_CO_CODE = "YOUR_EPOCH_CO_CODE" # e.g., 'niro123'
    
    # Epoch me har price point/package ka ek unique 'pi_code' (Product Code) hota hai
    # Demo ke liye hum isko dummy rakh rahe hain
    EPOCH_PI_CODE = "COIN_PACKAGE_1" 
    
    # Custom pass-through parameters ('x_' se start hote hain) jo Epoch hume wapas bhejega
    x_viewer_id = current_viewer.id
    x_coins = request.coins
    
    # Return URL jaha user payment ke baad wapas aayega
    return_url = "http://localhost:5173/viewer/profile"
    
    # Epoch Hosted Checkout URL construct karein
    epoch_checkout_url = (
        f"https://secure.epoch.com/process/purchase?"
        f"co_code={EPOCH_CO_CODE}&pi_code={EPOCH_PI_CODE}"
        f"&x_viewer_id={x_viewer_id}&x_coins={x_coins}"
        f"&pi_returnurl={return_url}"
    )
    
    return {"checkout_url": epoch_checkout_url}


# --- EPOCH POSTBACK (WEBHOOK) ---
# Ye endpoint URL aapko Epoch ke dashboard me set karni hogi (e.g., https://yourdomain.com/api/payments/epoch-postback)
@app.post("/api/payments/epoch-postback")
async def epoch_postback(request: Request, db: Session = Depends(get_db)):
    # Epoch data URL-encoded form data (POST) ke roop me bhejta hai
    form_data = await request.form()
    
    # Epoch variables nikalna
    # 'ans' = 'Y' means Approved, 'N' means Declined
    status = form_data.get("ans") 
    transaction_id = form_data.get("ets_transaction_id")
    viewer_id = form_data.get("x_viewer_id")
    coins_to_add = form_data.get("x_coins")
    
    # Security: In production, you should also verify the Epoch hash (pi_hash) here 
    # to ensure the postback actually came from Epoch and wasn't forged.

    if status == "Y" and viewer_id and coins_to_add:
        # Find user and add coins
        viewer = db.query(models.Viewer).filter(models.Viewer.id == int(viewer_id)).first()
        if viewer:
            # Atomic update
            viewer.wallet_balance += int(coins_to_add)
            
            # (Optional) Log this transaction in a PaymentHistory table here
            
            db.commit()
            print(f"✅ EPOCH SUCCESS: Added {coins_to_add} coins to Viewer {viewer.username}")
            
            # Epoch postback ko hamesha 200 OK return karna chahiye
            return "OK"
            
    print("❌ EPOCH POSTBACK FAILED OR DECLINED")
    return "Error processing postback"

# --- 1. ADMIN SECURITY HELPER ---
def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized as Admin")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Admin Token")

# --- 2. CREATE FIRST SUPERUSER (Run this once, then you can remove it) ---
class AdminSetupRequest(BaseModel):
    username: str
    password: str
    secret_key: str # Taki koi bhi admin create na kar sake

@app.post("/api/admin/setup-superuser")
def setup_superuser(request: AdminSetupRequest, db: Session = Depends(get_db)):
    # Master key to allow creation
    if request.secret_key != "nirochart-master-key-2024":
        raise HTTPException(status_code=403, detail="Invalid secret key")
        
    existing_admin = db.query(models.AdminUser).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists!")

    new_admin = models.AdminUser(
        username=request.username,
        password_hash=pwd_context.hash(request.password)
    )
    db.add(new_admin)
    db.commit()
    return {"message": "Superuser created successfully!"}

# --- 3. ADMIN LOGIN ENDPOINT ---
class AdminLoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/admin/login")
def login_admin(request: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(models.AdminUser).filter(models.AdminUser.username == request.username).first()
    if not admin or not pwd_context.verify(request.password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Invalid admin credentials")

    expiration = datetime.utcnow() + timedelta(hours=12)
    token = jwt.encode({
        "sub": admin.username,
        "role": "admin",
        "exp": expiration
    }, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token}

# --- 1. OVERVIEW / STATS DASHBOARD ---
@app.get("/api/admin/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    total_models = db.query(models.ModelApplication).filter(models.ModelApplication.status == "approved").count()
    total_viewers = db.query(models.Viewer).count()
    
    # Platform ne kitna kamaya (Maan lijiye platform 20% commission rakhta hai)
    total_tips = db.query(models.TipTransaction).all()
    total_coins_exchanged = sum(tip.amount for tip in total_tips)
    
    active_streams = db.query(models.LiveStream).filter(models.LiveStream.is_live == True).count()

    return {
        "total_models": total_models,
        "total_viewers": total_viewers,
        "platform_revenue_coins": total_coins_exchanged * 0.20, # 20% cut
        "active_streams": active_streams
    }

# --- 2. GET ALL MODELS (Pending, Approved, Blocked) ---
@app.get("/api/admin/all-models")
def get_all_models(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(models.ModelApplication).all()

# --- 3. UPDATE MODEL STATUS (APPROVE, REJECT, BLOCK, UNBLOCK) ---
@app.put("/api/admin/models/{model_id}/status")
def update_model_status(model_id: int, status: str, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    valid_statuses = ["pending", "approved", "rejected", "blocked"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    model = db.query(models.ModelApplication).filter(models.ModelApplication.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    model.status = status
    
    # Agar model block ho raha hai, toh uski active stream bhi band karni padegi
    if status == "blocked":
        active_stream = db.query(models.LiveStream).filter(
            models.LiveStream.room_id == str(model_id), 
            models.LiveStream.is_live == True
        ).first()
        if active_stream:
            active_stream.is_live = False

    db.commit()
    return {"message": f"Model status updated to {status}"}