# Python Standard Library
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import List, Optional

# Data Processing & Machine Learning
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras.models import load_model
from textblob import TextBlob

# FastAPI & Web
from fastapi import FastAPI, HTTPException, Depends, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

# Database & ORM
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Text, 
    ForeignKey, DECIMAL, create_engine, func, case, text
)
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import relationship, sessionmaker, Session

# Authentication & Security
import jwt
from passlib.context import CryptContext

# Third Party APIs & Services
import finnhub
import yfinance as yf
import requests

# Logging Configuration
from fastapi.logger import logger as fastapi_logger

# Environment Variables
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Cấu hình logging cho toàn bộ ứng dụng
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Gán lại logger FastAPI nếu cần
fastapi_logger.handlers = logger.handlers
fastapi_logger.setLevel(logging.INFO) 

# FastAPI app initialization
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
SQLALCHEMY_DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# Cấu hình NewsAPI
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
NEWS_API_URL = "https://newsapi.org/v2/everything"

# Load GRU model
model_gru = load_model('model\\gru_model.keras')
SEQUENCE_LENGTH = int(os.getenv("SEQUENCE_LENGTH")) # Định nghĩa các hằng số cho GRU model
N_FEATURES = int(os.getenv("N_FEATURES"))

# Thêm hằng số cho API key
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")

# Thêm hằng số cho API key 
ALPHA_VANTAGE_API_KEY_DEMO = os.getenv("ALPHA_VANTAGE_API_KEY_DEMO")

# Khởi tạo MinMaxScaler
scaler = MinMaxScaler(feature_range=(0, 1))

# Database Models
class User(Base):
    __tablename__ = "users" 
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))

    # Sử dụng quan hệ để lấy dữ liệu từ bảng UserWatchlist
    watchlist_items = relationship("UserWatchlist", back_populates="user", cascade="all, delete-orphan")

class Sector(Base):
    __tablename__ = "sectors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)

    companies = relationship("Company", back_populates="sector")

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    symbol = Column(String(10), unique=True, nullable=False)
    sector_id = Column(Integer, ForeignKey("sectors.id"))
    description = Column(Text, nullable=True)

    sector = relationship("Sector", back_populates="companies")  # Quan hệ với bảng Sector
    stocks = relationship("Stocks", back_populates="company")
    news = relationship("News", back_populates="company")

class Stocks(Base):
    __tablename__ = "stocks" 
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"))
    open = Column(DECIMAL(10, 2), nullable=True)
    high = Column(DECIMAL(10, 2), nullable=True)
    low = Column(DECIMAL(10, 2), nullable=True)
    close = Column(DECIMAL(10, 2), nullable=True)
    volume = Column(Integer, nullable=True)
    adj_close = Column(DECIMAL(10, 2), nullable=True)
    news_positive_sentiment = Column(Integer, nullable=True)
    news_negative_sentiment = Column(Integer, nullable=True)
    company = relationship("Company", back_populates="stocks")

class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"))
    source = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(Text, nullable=True)
    urltoimage = Column(Text, nullable=True)  # Changed from urlToImage to urltoimage
    publishedat = Column(TIMESTAMP, nullable=True)  # Changed from publishedAt to publishedat
    content = Column(Text, nullable=True)
    sentiment = Column(Integer,nullable=True) # thêm sentiment
    
    company = relationship("Company", back_populates="news")

class UserWatchlist(Base):
    __tablename__ = "userwatchlist"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"))
    # Thiết lập mối quan hệ với bảng User và Company
    user = relationship("User", back_populates="watchlist_items")
    company = relationship("Company")

# Pydantic Models
class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class WatchlistUpdate(BaseModel):
    symbols: List[str]

class StockPrediction(BaseModel):
    symbol: str
    predictions: List[float]
    dates: List[str]

# Authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401)
        return email
    except jwt.JWTError:
        raise HTTPException(status_code=401)

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

#Endpoint
@app.post("/register")
async def register(user: UserCreate):
    db = SessionLocal()
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/market-info/{symbol}")
async def get_market_info(symbol: str, period: str = "1d", interval: str = "1m"):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        
        # Định nghĩa các khoảng thời gian và interval tương ứng
        period_intervals = {
            "1d": "1m",
            "5d": "5m",
            "1mo": "1h",
            "6mo": "1d",
            "ytd": "1d",
            "1y": "1d",
            "5y": "1wk"
        }
        
        # Sử dụng interval được định nghĩa hoặc mặc định theo period
        interval_to_use = period_intervals.get(period, interval)
        
        # Lấy dữ liệu lịch sử
        data = stock.history(period=period, interval=interval_to_use)
        
        if data.empty:
            return {"error": "No data found for symbol"}
        
        latest_data = data.iloc[-1]
        first_data = data.iloc[0]
        
        # Tính toán thay đổi giá và phần trăm
        price_change = latest_data["Close"] - first_data["Open"]
        price_change_percent = (price_change / first_data["Open"]) * 100
        
        # Lấy giá đóng cửa để vẽ biểu đồ
        price_history = data['Close'].tolist()
        timestamps = [idx.strftime('%Y-%m-%d %H:%M:%S') for idx in data.index]
        
        # Lấy khối lượng trung bình 3 tháng
        three_month_data = stock.history(period="3mo")
        avg_volume_3m = int(three_month_data['Volume'].mean())
        
        # Format market cap
        market_cap = info.get('marketCap', 0)
        if market_cap >= 1e12:
            market_cap_str = f"{market_cap/1e12:.3f}T"
        else:
            market_cap_str = f"{market_cap/1e9:.3f}B"
            
        return {
            "symbol": symbol,
            "name": info.get('longName', 'N/A'),
            "price": round(latest_data["Close"], 4),
            "change": round(price_change, 2),
            "change_percent": round(price_change_percent, 2),
            "volume": int(latest_data["Volume"]),
            "avg_volume_3m": avg_volume_3m,
            "market_cap": market_cap_str,
            "price_history": price_history,
            "timestamps": timestamps,
            "period": period,
            "interval": interval_to_use
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Watchlist không có tên công ty
@app.get("/watchlist", response_model=List[str])
async def get_watchlist(current_user: str = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.email == current_user).first()
    # Lấy danh sách `symbol` từ các mục trong `watchlist`
    watchlist_symbols = [item.company.symbol for item in user.watchlist_items]
    return watchlist_symbols

#Lấy thông tin công ty
async def get_company_info(ticker):
    try:
        company = yf.Ticker(ticker)
        company_info = company.info
        if not company_info:
            return None, None
            
        company_name = company_info.get('longName', 'Không tìm thấy tên công ty')
        sector_name = company_info.get('sector', 'Unknown')
        logger.info(f"Company info for {ticker}: {company_name}, {sector_name}")
        return company_name, sector_name
    except Exception as e:
        logger.error(f"Error fetching company info for {ticker}: {e}")
        return None, None

# ...existing code...
@app.put("/watchlist") 
async def update_watchlist(watchlist: WatchlistUpdate, current_user: str = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.email == current_user).first()
    db.query(UserWatchlist).filter(UserWatchlist.user_id == user.id).delete()
    
    for symbol in watchlist.symbols:
        company = db.query(Company).filter(Company.symbol == symbol).first()
        
        if not company:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                
                company_name = info.get('longName')
                sector_name = info.get('sector')
                
                if not company_name or not sector_name:
                    logger.warning(f"Missing info for {symbol}")
                    continue
                    
                sector = db.query(Sector).filter(Sector.name == sector_name).first()
                if not sector:
                    sector = Sector(name=sector_name) 
                    db.add(sector)
                    db.commit()
                    db.refresh(sector)

                company = Company(name=company_name, symbol=symbol, sector_id=sector.id)
                db.add(company)
                try:
                    db.commit()
                except IntegrityError:
                    db.rollback()
                    continue
                    
            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")
                continue

        watchlist_item = UserWatchlist(user_id=user.id, company_id=company.id)
        db.add(watchlist_item)

    db.commit()
    return {"message": "Watchlist updated successfully"}

# Lấy danh sách mã chứng khoán trong watchlist
# Watchlist có tên công ty 
@app.get("/watchlist_name", response_model=List[dict])
async def get_watchlist(current_user: str = Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.email == current_user).first()
    
    # Lấy danh sách `symbol` và `name` từ các mục trong `watchlist`
    watchlist_items = [
        {"symbol": item.company.symbol, "name": item.company.name} 
        for item in user.watchlist_items
    ]
    return watchlist_items

# Hàm get_db đ quản lý database session 
def get_db():
    """Tạo và quản lý database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dự đoán giá cổ phiếu sử dụng GRU
@app.get("/predict-using-gru/{symbol}")
async def predict_using_gru(symbol: str, db: Session = Depends(get_db)):
    try:
        # Kiểm tra công ty tồn tại
        company = db.query(Company).filter(Company.symbol == symbol).first()
        if not company:
            raise HTTPException(status_code=404, detail="Symbol not found")

        # Lấy dữ liệu lịch sử từ yfinance
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        stock_data = yf.download(symbol, start=start_date, end=end_date)

        # Cập nhật dữ liệu vào bảng stocks nếu thiếu
        for date, row in stock_data.iterrows():
            stock = db.query(Stocks).filter(
                Stocks.date == date.date(),
                Stocks.company_id == company.id
            ).first()

            if not stock:
                stock = Stocks(
                    date=date.date(),
                    company_id=company.id,
                    open=row['Open'].item(),
                    high=row['High'].item(),
                    low=row['Low'].item(),
                    close=row['Close'].item(),
                    volume=row['Volume'].item(),
                    adj_close=row['Adj Close'].item()
                )
                db.add(stock)

        # Kiểm tra và cập nhật tin tức
        dates_to_check = [(end_date - timedelta(days=x)).date() for x in range(30)]
        for date in dates_to_check:
            news_count = db.query(News).filter(
                News.date == date,
                News.company_id == company.id
            ).count()
            
            if news_count < 90:
                params = {
                    'q': company.name,  # Chỉ sử dụng tên công ty
                    'from': date.strftime('%Y-%m-%d'),
                    'to': date.strftime('%Y-%m-%d'),
                    'language': 'en',
                    'apiKey': NEWS_API_KEY,
                    'pageSize': 100
                }
                
                response = requests.get(NEWS_API_URL, params=params)
                articles = response.json().get('articles', [])
                
                for article in articles:
                    try:
                        if news_count >= 90:
                            break

                        if not article.get('url'):
                            continue

                        # Kiểm tra xem tin tức đã tồn tại chưa
                        existing_news = db.query(News).filter(
                            News.date == date,
                            News.company_id == company.id,
                            News.url == article.get('url')
                        ).first()

                        # Chỉ thêm tin tức mới nếu chưa tồn tại
                        if not existing_news:
                            text = f"{article.get('title', '')} {article.get('description', '')} {article.get('content', '')}"
                            sentiment = 1 if TextBlob(text).sentiment.polarity > 0 else -1
                            news = News(
                                date=date,
                                company_id=company.id,
                                source=article.get('source', {}).get('name'),
                                title=article.get('title'),
                                description=article.get('description'),
                                url=article.get('url'),
                                urltoimage=article.get('urlToImage'),
                                publishedat=article.get('publishedAt'),
                                content=article.get('content'),
                                sentiment=sentiment
                            )
                            db.add(news)
                            try:
                                db.commit()
                                news_count += 1
                            except IntegrityError:
                                db.rollback()
                                continue
                    except Exception as e:
                        db.rollback()
                        logger.error(f"Error processing article for {symbol} on {date}: {str(e)}")
                        continue

                logger.info(f"Collected {news_count} news articles for {symbol} on {date}")

        db.commit()

        # Cập nhật sentiment counts vào bảng stocks 
        for date in dates_to_check:
            sentiment_counts = db.query(
                func.sum(case((News.sentiment == 1, 1), else_=0)).label('positive'),
                func.sum(case((News.sentiment == -1, 1), else_=0)).label('negative')
            ).filter(
                News.company_id == company.id,
                News.date == date
            ).first()

            stock = db.query(Stocks).filter(
                Stocks.date == date,
                Stocks.company_id == company.id
            ).first()

            if stock:
                stock.news_positive_sentiment = sentiment_counts.positive or 0
                stock.news_negative_sentiment = sentiment_counts.negative or 0

        db.commit()

        # Lấy dữ liệu để dự đoán
        stock_data = db.query(Stocks).filter(
            Stocks.company_id == company.id,
            Stocks.date >= start_date.date(),
            Stocks.date <= end_date.date()
        ).order_by(Stocks.date).all()

        # Chuẩn bị dữ liệu cho dự đoán
        close_prices = [float(s.close) for s in stock_data[-30:]]
        historical_dates = [s.date.strftime('%Y-%m-%d') for s in stock_data[-30:]]
        
        price_min = min(close_prices)
        price_max = max(close_prices)
        
        # Chuẩn bị sequence cho dự đoán
        current_sequence = np.zeros((1, SEQUENCE_LENGTH, N_FEATURES))
        
        # Lấy 30 ngày dữ liệu gần nhất
        recent_stocks = stock_data[-SEQUENCE_LENGTH:]
        
        # Điền dữ liệu vào sequence
        for i, stock in enumerate(recent_stocks):
            current_sequence[0, i, 0] = (float(stock.open) - price_min) / (price_max - price_min)
            current_sequence[0, i, 1] = (float(stock.high) - price_min) / (price_max - price_min)
            current_sequence[0, i, 2] = (float(stock.low) - price_min) / (price_max - price_min)
            current_sequence[0, i, 3] = (float(stock.close) - price_min) / (price_max - price_min)
            current_sequence[0, i, 4] = float(stock.volume)
            current_sequence[0, i, 5] = 0  # Symbol index
            current_sequence[0, i, 6] = stock.news_positive_sentiment or 0
            current_sequence[0, i, 7] = stock.news_negative_sentiment or 0

        predictions = []
        prediction_dates = []
        current_date = stock_data[-1].date

        for _ in range(7):
            # Dự đoán sử dụng model GRU
            pred = model_gru.predict(current_sequence, verbose=0)
            
            # Chuyển đổi về giá gốc
            predicted_value = pred[0][0]
            original_price = predicted_value * (price_max - price_min) + price_min
            predictions.append(float(original_price))

            # Cập nhật sequence cho lần dự đoán tiếp theo
            next_sequence = np.roll(current_sequence, -1, axis=1)
            
            # Chuẩn hóa giá trị dự đoán
            normalized_pred = (original_price - price_min) / (price_max - price_min)
            
            # Cập nhật features cho timestep cuối cùng
            next_features = np.zeros(N_FEATURES)
            next_features[0] = normalized_pred  # Open
            next_features[1] = normalized_pred * 1.01  # High
            next_features[2] = normalized_pred * 0.99  # Low
            next_features[3] = normalized_pred  # Close
            next_features[4] = current_sequence[0, -1, 4]  # Volume
            next_features[5] = 0  # Symbol index
            next_features[6] = current_sequence[0, -1, 6]  # Sentiment positive
            next_features[7] = current_sequence[0, -1, 7]  # Sentiment negative

            # Cập nhật timestep cuối cùng
            next_sequence[0, -1] = next_features
            current_sequence = next_sequence

            # Tạo ngày tiếp theo (bỏ qua cuối tuần)
            current_date = current_date + timedelta(days=1)
            while current_date.weekday() > 4:
                current_date = current_date + timedelta(days=1)
            prediction_dates.append(current_date.strftime('%Y-%m-%d'))

        return {
            "symbol": symbol,
            "historical_dates": historical_dates,
            "historical_prices": close_prices,
            "dates": prediction_dates,
            "predicted_prices": predictions
        }

    except Exception as e:
        logger.error(f"Error in predict_using_gru for symbol {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Có lỗi xảy ra khi dự đoán cho mã {symbol}: {str(e)}"
        )

# Lấy số lượng tin tức theo ngày 
@app.get("/news-sentiment/{symbol}/{days_ago}")
async def get_news_sentiment(symbol: str, days_ago: int, db: Session = Depends(get_db)):
    try:
        if days_ago <= 0 or days_ago > 365:
            raise HTTPException(
                status_code=400,
                detail="days_ago phải từ 1 đến 365 ngày"
            )

        # Lấy thông tin công ty
        company = db.query(Company).filter(Company.symbol == symbol).first()
        if not company:
            raise HTTPException(
                status_code=404,
                detail=f"Không tìm thấy công ty với mã {symbol}"
            )

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_ago)

        dates_to_check = []
        current_date = start_date
        while current_date <= end_date:
            dates_to_check.append(current_date)
            current_date += timedelta(days=1)

        # Thu thập tin tức cho tất cả các ngày
        for date in dates_to_check:
            try:
                # Đếm số lượng tin tức hiện có
                existing_count = db.query(News).filter(
                    News.date == date,
                    News.company_id == company.id
                ).count()

                if existing_count >= 90:
                    logger.info(f"Already have {existing_count} articles for {symbol} on {date}")
                    continue

                # Số lượng bài báo cần thêm
                articles_needed = 90 - existing_count

                params = {
                    'q': company.name,
                    'from': date.strftime('%Y-%m-%d'),
                    'to': date.strftime('%Y-%m-%d'),
                    'language': 'en',
                    'apiKey': NEWS_API_KEY,
                    'pageSize': 100
                }

                response = requests.get(NEWS_API_URL, params=params)
                if response.status_code != 200:
                    logger.error(f"Failed to fetch news for {symbol} on {date}: {response.status_code}")
                    continue

                articles = response.json().get('articles', [])
                articles_added = 0

                for article in articles:
                    if articles_added >= articles_needed:
                        break

                    if not article.get('url'):
                        continue

                    # Kiểm tra URL đã tồn tại
                    existing_news = db.query(News).filter(
                        News.date == date,
                        News.company_id == company.id,
                        News.url == article.get('url')
                    ).first()

                    if not existing_news:
                        try:
                            text = f"{article.get('title', '')} {article.get('description', '')} {article.get('content', '')}"
                            sentiment = 1 if TextBlob(text).sentiment.polarity > 0 else -1
                            news = News(
                                date=date,
                                company_id=company.id,
                                source=article.get('source', {}).get('name'),
                                title=article.get('title'),
                                description=article.get('description'),
                                url=article.get('url'),
                                urltoimage=article.get('urlToImage'),
                                publishedat=article.get('publishedAt'),
                                content=article.get('content'),
                                sentiment=sentiment
                            )
                            db.add(news)
                            db.commit()
                            articles_added += 1
                        except IntegrityError:
                            db.rollback()
                            continue
                        except Exception as e:
                            db.rollback()
                            logger.error(f"Error adding article for {symbol} on {date}: {str(e)}")
                            continue

                logger.info(f"Added {articles_added} new articles for {symbol} on {date}")

            except Exception as e:
                logger.error(f"Error processing news for {symbol} on {date}: {str(e)}")
                continue

        # Lấy thống kê sentiment
        sentiment_stats = db.query(
            News.date,
            func.count(case([(News.sentiment == 1, 1)])).label('positive'),
            func.count(case([(News.sentiment == -1, 1)])).label('negative')
        ).filter(
            News.company_id == company.id,
            News.date >= start_date,
            News.date <= end_date
        ).group_by(News.date).order_by(News.date).all()

        if not sentiment_stats:
            return {
                "dates": [],
                "positive_counts": [],
                "negative_counts": []
            }

        dates = [stat.date.strftime("%Y-%m-%d") for stat in sentiment_stats]
        positive_counts = [stat.positive or 0 for stat in sentiment_stats]
        negative_counts = [stat.negative or 0 for stat in sentiment_stats]

        return {
            "dates": dates,
            "positive_counts": positive_counts,
            "negative_counts": negative_counts
        }

    except Exception as e:
        logger.error(f"Error in get_news_sentiment for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Có lỗi xảy ra khi lấy dữ liệu sentiment cho mã {symbol}: {str(e)}"
        )

# Lấy tin tức theo ngày để hiển thị trên trang cá nhân
@app.get("/news-articles/{symbol}/{days_ago}")
async def get_news_articles(symbol: str, days_ago: int, page: int = 1, items_per_page: int = 12, db: Session = Depends(get_db)):
    try:
        # Lấy thông tin công ty
        company = db.query(Company).filter(Company.symbol == symbol).first()
        if not company:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy công ty với mã {symbol}")

        # Tính toán ngày bắt đầu
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_ago)

        # Lấy các bài báo trong khoảng thời gian
        articles_query = db.query(News).filter(
            News.company_id == company.id,
            News.date >= start_date,
            News.date <= end_date
        ).order_by(News.date.desc())

        # Phân trang
        total_articles = articles_query.count()
        articles = articles_query.offset((page - 1) * items_per_page).limit(items_per_page).all()

        # Chuyển đổi kết quả thành định dạng JSON
        articles_data = [
            {
                "title": article.title,
                "url": article.url,
                "source": article.source,
                "sentiment": "Positive" if article.sentiment == 1 else "Negative",
                "date": article.date.strftime("%Y-%m-%d"),
                "urlToImage": article.urltoimage  # Thêm trường urltoimage vào response
            }
            for article in articles
        ]

        return {
            "articles": articles_data,
            "total_articles": total_articles,
            "current_page": page,
            "total_pages": (total_articles + items_per_page - 1) // items_per_page
        }

    except Exception as e:
        logger.error(f"Error in get_news_articles for symbol {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Có lỗi xảy ra khi lấy bài báo cho mã {symbol}: {str(e)}")

# NHỮNG MÃ TĂNG GIÁ GIẢM GIÁ HÀNG ĐẦU
@app.get("/market-movers")
async def get_market_movers():
    try:
        url = f"https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey={ALPHA_VANTAGE_API_KEY_DEMO}"
        response = requests.get(url)
        data = response.json()
        
        return {
            "top_gainers": data.get("top_gainers", [])[:20],  # Lấy top 5
            "top_losers": data.get("top_losers", [])[:20],    # Lấy top 5
            "most_active": data.get("most_actively_traded", [])[:20]  # Lấy top 5
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy dữ liệu market movers: {str(e)}"
        )

# TIN TỨC THỊ TRƯỜNG 
@app.get("/market-news")
async def get_market_news(page: int = 1, items_per_page: int = 12):
    try:
        # Khởi tạo Finnhub client
        finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)
        
        # Lấy tất cả tin tức
        news = finnhub_client.general_news('general', min_id=0)
        
        # Tính toán phân trang
        start_idx = (page - 1) * items_per_page
        end_idx = start_idx + items_per_page
        page_news = news[start_idx:end_idx]
        
        # Format tin tức cho trang hiện tại
        formatted_news = []
        for article in page_news:
            formatted_news.append({
                "category": article.get("category", ""),
                "datetime": datetime.fromtimestamp(article["datetime"]).strftime("%Y-%m-%d %H:%M:%S"),
                "headline": article.get("headline", ""),
                "image": article.get("image", ""),
                "source": article.get("source", ""),
                "summary": article.get("summary", ""),
                "url": article.get("url", "")
            })
            
        return {
            "news": formatted_news,
            "total_items": len(news),
            "current_page": page,
            "total_pages": (len(news) + items_per_page - 1) // items_per_page
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy tin tức: {str(e)}"
        )

#LỊCH IPO SẮP DIỄN RA
@app.get("/ipo-calendar")
async def get_ipo_calendar(from_date: str = None, to_date: str = None):
    try:
        # Nếu không có ngày được chỉ định, lấy mặc định 30 ngày tới
        if not from_date:
            from_date = datetime.now().strftime("%Y-%m-%d")
        if not to_date:
            to_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            
        # Khởi tạo Finnhub client
        finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)
        
        # Lấy dữ liệu IPO
        ipo_data = finnhub_client.ipo_calendar(_from=from_date, to=to_date)
        
        # Sắp xếp theo ngày
        if ipo_data & "ipoCalendar" in ipo_data:
            ipo_data["ipoCalendar"].sort(key=lambda x: x["date"])
            
        return ipo_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy dữ liệu IPO: {str(e)}"
        )
    
#API xem thông tin s&p500 vvv
@app.get("/market-indices")
async def get_market_indices():
    try:
        indices = {
            "Dow Jones": "^DJI",
            "S&P 500": "^GSPC",
            "Nasdaq Composite": "^IXIC",
            "Russell 2000": "^RUT",
            "VIX": "^VIX"
        }
        
        data = {}
        for name, symbol in indices.items():
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")  # Lấy dữ liệu trong 5 ngày
            if hist.empty or len(hist) < 2:
                logger.error(f"Not enough historical data found for {symbol}")
                continue
            
            close_price = hist['Close'].iloc[-1]
            prev_close_price = hist['Close'].iloc[-2]
            change = close_price - prev_close_price
            change_percent = (change / prev_close_price) * 100
            data[name] = {
                "price": close_price,
                "change": change,
                "change_percent": change_percent
            }
        
        return data
    except Exception as e:
        logger.error(f"Error fetching market indices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Thêm endpoint để lấy thông tin cơ bản của công ty
@app.get("/company-info/{symbol}")
async def get_company_info(symbol: str, db: Session = Depends(get_db)):
    try:
        company = yf.Ticker(symbol)
        info = company.info
        financials = company.financials

        # Xử lý các giá trị NaN trong financials
        financials = financials.replace({np.nan: None})

        return {
            "symbol": symbol,
            "name": info.get('longName', 'N/A'),
            "sector": info.get('sector', 'N/A'),
            "industry": info.get('industry', 'N/A'),
            "website": info.get('website', 'N/A'),
            "longBusinessSummary": info.get('longBusinessSummary', 'N/A'),
            "financials": financials.to_dict() if not financials.empty else {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Chạy ứng dụng FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000 ,log_level="info",reload=True)