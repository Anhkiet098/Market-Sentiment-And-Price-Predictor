-- **- Tạo bảng Người Dùng**
CREATE TABLE Users (
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
hashed_password VARCHAR(255) NOT NULL
);

-- **- Tạo bảng Sectors**
CREATE TABLE Sectors (
id SERIAL PRIMARY KEY,
name VARCHAR(100) UNIQUE NOT NULL
);

-- **- Tạo bảng Công Ty**
CREATE TABLE Companies (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
symbol VARCHAR(10) UNIQUE NOT NULL,
sector_id INT REFERENCES Sectors(id),
description TEXT
);

-- **- Tạo bảng Cổ Phiếu**
CREATE TABLE Stocks (
id SERIAL PRIMARY KEY,
date DATE NOT NULL,
company_id INT REFERENCES Companies(id),
open DECIMAL(10, 2),
high DECIMAL(10, 2),
low DECIMAL(10, 2),
close DECIMAL(10, 2),
volume INT,
returns DECIMAL(5, 2),
adj_close numeric(10,2),
news_positive_sentiment integer,
news_negative_sentiment integer
);

-- **- Tạo bảng Tin Tức**
CREATE TABLE News (
id SERIAL PRIMARY KEY,
date DATE NOT NULL,
company_id INT REFERENCES Companies(id),
source VARCHAR(255),
name VARCHAR(255),
title TEXT NOT NULL,
description TEXT,
url TEXT,
urltoimage TEXT,
publishedat TIMESTAMP,
content TEXT
);

-- **-Tạo bảng UserWatchlist để lưu watchlist của người dùng**
CREATE TABLE UserWatchlist (
id SERIAL PRIMARY KEY,
user_id INT REFERENCES Users(id) ON DELETE CASCADE,
company_id INT REFERENCES Companies(id) ON DELETE CASCADE
);

-- - **Tạo chỉ số trên cột date và company_id cho bảng Stocks và News**
CREATE INDEX idx_stocks_date_company ON Stocks(date, company_id);
CREATE INDEX idx_news_date_company ON News(date, company_id);

ALTER TABLE News 
ALTER COLUMN title TYPE TEXT,
ALTER COLUMN description TYPE TEXT,
ALTER COLUMN url TYPE TEXT,
ALTER COLUMN urlToImage TYPE TEXT,
ALTER COLUMN content TYPE TEXT;

ALTER TABLE stocks ADD CONSTRAINT unique_date_company UNIQUE (date, company_id);

ALTER TABLE news ADD CONSTRAINT unique_news_entry UNIQUE (date, company_id, url);

