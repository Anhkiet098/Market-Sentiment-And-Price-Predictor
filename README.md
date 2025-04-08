# Ứng dụng Phân tích Thị trường Chứng khoán

Dự án này chứa dịch vụ backend(Fast_API) và prontend(react-app-finance) cho **Ứng dụng Phân tích Thị trường Chứng khoán**, được xây dựng bằng FastAPI và thiết kế để hoạt động cùng với giao diện người dùng React. Ứng dụng cung cấp cho người dùng các công cụ để khám phá dữ liệu thị trường chứng khoán, dự đoán giá cổ phiếu bằng mô hình học máy, phân tích cảm xúc tin tức, và quản lý danh sách theo dõi cá nhân. Nó tích hợp với các API tài chính bên ngoài để lấy dữ liệu thời gian thực và lịch sử, là công cụ mạnh mẽ cho những người đam mê và nhà đầu tư chứng khoán.

## Mục lục

1. [Tính năng](#features)
2. [Công nghệ sử dụng](#technologies-used)
3. [Cài đặt và triển khai](#setup-and-installation)
4. [Sơ đồ cơ sở dữ liệu](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Mô hình học máy](#machine-learning-models)
7. [Tích hợp API bên ngoài](#external-api-integrations)
8. [Xác thực](#authentication)
9. [Sơ đồ luồng API](#api-flow-diagrams)
10. [Đóng góp](#contributing)
11. [Giấy phép](#license)

## Tính năng

- **Xác thực người dùng**: Đăng ký và đăng nhập an toàn với xác thực dựa trên JWT.
- **Truy xuất dữ liệu cổ phiếu**: Truy cập giá cổ phiếu thời gian thực và lịch sử cùng thông tin công ty.
- **Dự đoán giá cổ phiếu**: Dự báo giá cổ phiếu trong tương lai bằng mô hình học máy GRU và LSTM.
- **Phân tích cảm xúc tin tức**: Lấy và phân tích các bài báo tin tức liên quan đến cổ phiếu cụ thể.
- **Quản lý danh sách theo dõi**: Cho phép người dùng tạo và quản lý danh sách cổ phiếu quan tâm.
- **Thông tin thị trường**: Lấy dữ liệu về các cổ phiếu tăng/giảm hàng đầu, tin tức thị trường, lịch IPO và dữ liệu chỉ số chính.

## Công nghệ sử dụng

- **Backend**: FastAPI (Python)
- **Frontend**: React
- **Cơ sở dữ liệu**: PostgreSQL với SQLAlchemy ORM
- **Học máy**: TensorFlow/Keras (mô hình GRU)
- **API bên ngoài**:
  - [Yahoo Finance (yfinance)](https://pypi.org/project/yfinance/) cho dữ liệu cổ phiếu
  - [NewsAPI](https://newsapi.org/) cho bài báo tin tức
  - [Alpha Vantage](https://www.alphavantage.co/) cho dữ liệu tăng/giảm
  - [Finnhub](https://finnhub.io/) cho tin tức thị trường và dữ liệu IPO
- **Xác thực**: JWT với OAuth2
- **Thư viện khác**: TextBlob (phân tích cảm xúc), Pandas, NumPy

## Cài đặt và triển khai

Thực hiện các bước sau để thiết lập và chạy backend cục bộ:

### Yêu cầu trước

- Python 3.8+
- PostgreSQL đã cài đặt và đang chạy
- Git
- Khóa API cho NewsAPI, Alpha Vantage và Finnhub (xem [Tích hợp API bên ngoài](#external-api-integrations))

### Các bước cài đặt

1. **Sao chép kho lưu trữ**:
   ```bash
   git clone https://github.com/yourusername/stock-market-analysis.git
   cd stock-market-analysis
   ```

2. **Thiết lập môi trường ảo**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Trên Windows: venv\Scripts\activate
   ```

3. **Cài đặt các gói phụ thuộc**:
   ```bash
   pip install -r requirements.txt
   ```
   *Lưu ý*: Nếu không có `requirements.txt`, cài đặt các gói sau:
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg2-binary pyjwt tensorflow yfinance pandas numpy textblob requests finnhub-python python-dotenv
   ```

4. **Cấu hình cơ sở dữ liệu**:
   - Tạo cơ sở dữ liệu PostgreSQL tên `stockdb`:
     ```bash
     psql -U postgres -c "CREATE DATABASE stockdb;"
     ```
   - Cập nhật URL cơ sở dữ liệu trong `main.py` nếu cần (mặc định: `postgresql://postgres:0988@localhost/stockdb`).

5. **Khởi tạo cơ sở dữ liệu**:
   Chạy đoạn mã Python sau để tạo bảng:
   ```python
   from main import Base, engine
   Base.metadata.create_all(bind=engine)
   ```

6. **Thiết lập khóa API**:
   Để tăng cường bảo mật, sử dụng tệp `.env` thay vì mã hóa cứng trong `main.py`. Tạo tệp `.env` trong thư mục gốc dự án:
   ```plaintext
   NEWS_API_KEY=your_newsapi_key
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   FINNHUB_API_KEY=your_finnhub_key
   ```
   Cài đặt `python-dotenv` và sửa `main.py` để tải các biến này:
   ```python
   from dotenv import load_dotenv
   import os
   load_dotenv()
   NEWS_API_KEY = os.getenv("NEWS_API_KEY")
   ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
   FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
   ```

7. **Chạy máy chủ**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

8. **Truy cập tài liệu API**:
   Mở trình duyệt và truy cập `http://localhost:8000/docs` để xem tài liệu Swagger UI tương tác.

## Sơ đồ cơ sở dữ liệu

Backend sử dụng cơ sở dữ liệu PostgreSQL với các bảng sau:

- **`users`**: Lưu thông tin đăng nhập người dùng (email, mật khẩu mã hóa).
- **`sectors`**: Phân loại công ty (ví dụ: Công nghệ, Tài chính).
- **`companies`**: Chi tiết về công ty (tên, mã cổ phiếu, lĩnh vực).
- **`stocks`**: Dữ liệu lịch sử cổ phiếu (giá mở, cao, thấp, đóng, khối lượng, cảm xúc).
- **`news`**: Bài báo tin tức liên kết với công ty (tiêu đề, URL, cảm xúc).
- **`userwatchlist`**: Liên kết người dùng với các công ty họ theo dõi.

### Sơ đồ quan hệ thực thể (ERD)
```mermaid
erDiagram
    USERS ||--o{ USERWATCHLIST : "có"
    SECTORS ||--o{ COMPANIES : "phân loại"
    COMPANIES ||--o{ STOCKS : "sở hữu"
    COMPANIES ||--o{ NEWS : "liên quan"
    USERWATCHLIST }o--|| COMPANIES : "theo dõi"

    USERS {
        int id PK
        string email "UNIQUE, NOT NULL"
        string hashed_password "NOT NULL"
    }
    SECTORS {
        int id PK
        string name "UNIQUE, NOT NULL"
    }
    COMPANIES {
        int id PK
        string name "NOT NULL"
        string symbol "UNIQUE, NOT NULL"
        int sector_id FK "REFERENCES Sectors(id)"
        text description
    }
    STOCKS {
        int id PK
        date date "NOT NULL"
        int company_id FK "REFERENCES Companies(id)"
        decimal open "DECIMAL(10,2)"
        decimal high "DECIMAL(10,2)"
        decimal low "DECIMAL(10,2)"
        decimal close "DECIMAL(10,2)"
        int volume
        decimal returns "DECIMAL(5,2)"
        numeric adj_close "NUMERIC(10,2)"
        int news_positive_sentiment
        int news_negative_sentiment
        constraint unique_date_company "UNIQUE (date, company_id)"
    }
    NEWS {
        int id PK
        date date "NOT NULL"
        int company_id FK "REFERENCES Companies(id)"
        string source "VARCHAR(255)"
        string name "VARCHAR(255)"
        text title "NOT NULL"
        text description
        text url
        text urltoimage
        timestamp publishedat
        text content
        constraint unique_news_entry "UNIQUE (date, company_id, url)"
    }
    USERWATCHLIST {
        int id PK
        int user_id FK "REFERENCES Users(id) ON DELETE CASCADE"
        int company_id FK "REFERENCES Companies(id) ON DELETE CASCADE"
    }
```

## API Endpoints

Dưới đây là tóm tắt chi tiết các endpoint API chính với ví dụ:

### Xác thực
- **`POST /register`**  
  Đăng ký người dùng mới.  
  **Body**: `{ "email": "string", "password": "string" }`  
  **Response**: `{ "message": "User created successfully" }`  
  **Ví dụ**:  
  Yêu cầu: `{ "email": "user@example.com", "password": "secure123" }`  
  Phản hồi: `{ "message": "User created successfully" }`

- **`POST /token`**  
  Đăng nhập người dùng và trả về mã JWT.  
  **Body**: `{ "username": "email", "password": "string" }`  
  **Response**: `{ "access_token": "string", "token_type": "bearer" }`  
  **Ví dụ**:  
  Yêu cầu: `{ "username": "user@example.com", "password": "secure123" }`  
  Phản hồi: `{ "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "token_type": "bearer" }`

### Danh sách theo dõi
- **`GET /watchlist`** *(Bảo vệ)*  
  Trả về danh sách mã cổ phiếu trong danh sách theo dõi của người dùng.  
  **Response**: `["symbol1", "symbol2", ...]`  
  **Ví dụ**:  
  Phản hồi: `["AAPL", "MSFT"]`

- **`PUT /watchlist`** *(Bảo vệ)*  
  Cập nhật danh sách theo dõi của người dùng.  
  **Body**: `{ "symbols": ["symbol1", "symbol2"] }`  
  **Response**: `{ "message": "Watchlist updated successfully" }`  
  **Ví dụ**:  
  Yêu cầu: `{ "symbols": ["AAPL", "TSLA"] }`  
  Phản hồi: `{ "message": "Watchlist updated successfully" }`

### Dữ liệu cổ phiếu
- **`GET /market-info/{symbol}`**  
  Lấy dữ liệu thị trường cho một cổ phiếu.  
  **Query Params**: `period` (ví dụ: "1d"), `interval` (ví dụ: "1m")  
  **Response**: Giá, khối lượng, vốn hóa thị trường, v.v.  
  **Ví dụ**:  
  Yêu cầu: `GET /market-info/AAPL?period=1d&interval=1m`  
  Phản hồi:  
  ```json
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 175.23,
    "change": 2.45,
    "change_percent": 1.42,
    "volume": 12345678,
    "avg_volume_3m": 98765432,
    "market_cap": "2.735T",
    "price_history": [174.50, 175.00, 175.23],
    "timestamps": ["2025-04-01 09:30:00", "2025-04-01 09:31:00", "2025-04-01 09:32:00"]
  }
  ```

- **`GET /predict-using-gru/{symbol}`**  
  Dự đoán giá cổ phiếu bằng GRU (7 ngày).  
  **Input**: Mã cổ phiếu (ví dụ: "AAPL")  
  **Response**: Giá lịch sử và dự đoán kèm ngày.  
  **Ví dụ**:  
  Yêu cầu: `GET /predict-using-gru/AAPL`  
  Phản hồi:  
  ```json
  {
    "symbol": "AAPL",
    "historical_dates": ["2025-03-02", "2025-03-03", ..., "2025-03-31"],
    "historical_prices": [170.12, 171.45, ..., 175.23],
    "dates": ["2025-04-01", "2025-04-02", ..., "2025-04-07"],
    "predicted_prices": [176.10, 177.25, ..., 180.50]
  }
  ```

### Tin tức và cảm xúc
- **`GET /news-sentiment/{symbol}/{days_ago}`**  
  Trả về phân tích cảm xúc của các bài báo tin tức.  
  **Input**: Mã cổ phiếu, số ngày trước (ví dụ: "AAPL", 30)  
  **Response**: `{ "dates": ["YYYY-MM-DD"], "positive_counts": [int], "negative_counts": [int] }`  
  **Ví dụ**:  
  Yêu cầu: `GET /news-sentiment/AAPL/30`  
  Phản hồi:  
  ```json
  {
    "dates": ["2025-03-02", "2025-03-03", ..., "2025-03-31"],
    "positive_counts": [5, 3, ..., 4],
    "negative_counts": [2, 1, ..., 3]
  }
  ```

- **`GET /news-articles/{symbol}/{days_ago}`**  
  Lấy các bài báo tin tức với phân trang.  
  **Query Params**: `page`, `items_per_page`  
  **Ví dụ**:  
  Yêu cầu: `GET /news-articles/AAPL/30?page=1&items_per_page=5`  
  Phản hồi:  
  ```json
  {
    "articles": [
      {
        "title": "Apple Unveils New Product",
        "url": "https://example.com/news1",
        "source": "Reuters",
        "sentiment": "Positive",
        "date": "2025-03-31",
        "urlToImage": "https://example.com/image.jpg"
      },
      ...
    ],
    "total_articles": 50,
    "current_page": 1,
    "total_pages": 10
  }
  ```

### Thông tin thị trường
- **`GET /market-movers`**  
  Trả về các cổ phiếu tăng/giảm hàng đầu và hoạt động mạnh nhất.  
  **Ví dụ**:  
  Phản hồi:  
  ```json
  {
    "top_gainers": [{"ticker": "AAPL", "price": "175.23", "change_percent": "1.42"}, ...],
    "top_losers": [{"ticker": "XYZ", "price": "10.50", "change_percent": "-5.20"}, ...],
    "most_active": [{"ticker": "TSLA", "price": "250.10", "volume": "98765432"}, ...]
  }
  ```

## Mô hình học máy

- **GRU (Gated Recurrent Unit)**:
  - **Đầu vào**: 30 ngày dữ liệu lịch sử cổ phiếu (8 đặc trưng: mở, cao, thấp, đóng, khối lượng, chỉ số mã, cảm xúc tích cực/tiêu cực).
  - **Đầu ra**: Giá dự đoán cho 7 ngày tiếp theo.

## Tích hợp API bên ngoài

- **Yahoo Finance (yfinance)**: Giá cổ phiếu, thông tin công ty.
- **NewsAPI**: Bài báo tin tức để phân tích cảm xúc.
- **Alpha Vantage**: Dữ liệu tăng/giảm, cảm xúc tin tức.
- **Finnhub**: Tin tức thị trường, lịch IPO.

## Xác thực

Xác thực dựa trên JWT:
1. Đăng ký qua `/register`.
2. Đăng nhập qua `/token` để nhận JWT.
3. Sử dụng mã trong tiêu đề `Authorization` cho các endpoint được bảo vệ.

## Sơ đồ luồng API

### Luồng xác thực
```mermaid
graph TD
    A[Người dùng] -->|POST /register| B[Endpoint Đăng ký]
    A -->|POST /token| C[Endpoint Đăng nhập]
    C -->|Trả về mã JWT| D[Người dùng]
    D -->|Sử dụng mã trong Header| E[Endpoint được bảo vệ]
```

### Luồng dự đoán cổ phiếu (GRU)
```mermaid
graph TD
    A[Người dùng] -->|"GET /predict-using-gru/{symbol}"| B[Endpoint Dự đoán]
    B -->|"Lấy dữ liệu lịch sử"| C[Cơ sở dữ liệu & yfinance]
    B -->|"Lấy cảm xúc tin tức"| D[NewsAPI & Cơ sở dữ liệu]
    C -->|"Chuẩn bị chuỗi"| E[Mô hình GRU]
    D -->|"Cập nhật cảm xúc"| E
    E -->|"Tạo dự đoán"| F[Trả về kết quả]
```

### Luồng phân tích cảm xúc tin tức
```mermaid
graph TD
    A[Người dùng] -->|"GET /news-sentiment/{symbol}/{days_ago}"| B[Endpoint Cảm xúc]
    B -->|"Lấy bài báo"| C[NewsAPI]
    C -->|"Phân tích cảm xúc"| D[TextBlob]
    D -->|"Lưu kết quả"| E[Cơ sở dữ liệu]
    B -->|"Lấy thống kê"| F[Trả về dữ liệu cảm xúc]
```

## Đóng góp

1. Fork kho lưu trữ.
2. Tạo nhánh tính năng (`git checkout -b feature/your-feature`).
3. Commit thay đổi (`git commit -m "Thêm tính năng của bạn"`).
4. Push lên nhánh (`git push origin feature/your-feature`).
5. Mở pull request.

## Giấy phép

Dự án này được cấp phép theo Giấy phép MIT. Xem tệp [LICENSE](LICENSE) để biết chi tiết.


