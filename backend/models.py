from sqlalchemy import Column, Integer, String, DateTime, Boolean
from database import Base
import datetime


class ModelApplication(Base):
    __tablename__ = "model_applications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, index=True, nullable=False)
    dob = Column(String, nullable=False)
    body_type = Column(String)
    interests = Column(String)

    id_front_path = Column(String, nullable=False)
    id_back_path = Column(String, nullable=False)
    selfie_path = Column(String, nullable=False)
    
    wallet_balance = Column(Integer, default=0)

    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
# 2. File ke end me ek naya table add karein:
class TipTransaction(Base):
    __tablename__ = "tip_transactions"

    id = Column(Integer, primary_key=True, index=True)
    viewer_id = Column(Integer, index=True, nullable=False)
    model_id = Column(Integer, index=True, nullable=False)
    amount = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)



class LiveStream(Base):
    __tablename__ = "live_streams"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, index=True) # Removed unique=True so a model can stream multiple times
    display_name = Column(String, nullable=False)
    stream_title = Column(String)
    thumbnail_url = Column(String)
    
    is_live = Column(Boolean, default=True)
    start_time = Column(DateTime, default=datetime.datetime.utcnow) # ADDED
    end_time = Column(DateTime, nullable=True)                      # ADDED
    last_heartbeat = Column(DateTime, default=datetime.datetime.utcnow)
    
    # backend/models.py ke aakhir me add karein
class Viewer(Base):
    __tablename__ = "viewers"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # Wallet balance for tipping (e.g., in virtual coins or cents)
    wallet_balance = Column(Integer, default=0) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
# backend/models.py ke aakhir me
class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)