# 🥤 Coca-Cola Stock Analytics Dashboard

An end-to-end stock analytics dashboard for **KO (The Coca-Cola Company)** combining historical price analysis, technical indicators, moving average overlays, and volume trends across a multi-year dataset (2020–2024).

![Dashboard Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![Python](https://img.shields.io/badge/Python-3.9%2B-blue) ![Chart.js](https://img.shields.io/badge/Chart.js-4.4-orange) ![Power BI](https://img.shields.io/badge/Power%20BI-Ready-yellow)

---

## 📌 Project Overview

This project builds a full analytics pipeline for Coca-Cola's stock (NYSE: KO):

- Fetches and processes 5 years of daily OHLCV data
- Computes technical indicators: MA, Bollinger Bands, RSI
- Visualizes everything in an interactive HTML/CSS/Chart.js dashboard
- Exports a structured CSV ready for Power BI executive reporting

---

## 🗂 Project Structure

```
CocaCola-Stock-Dashboard/
│
├── index.html              # Main interactive dashboard (open in browser)
├── generate_data.py        # Python pipeline: fetch → process → export
├── requirements.txt        # Python dependencies
│
├── css/
│   └── style.css           # Dark-theme Coca-Cola branded stylesheet
│
├── js/
│   └── dashboard.js        # Chart.js chart logic & interactivity
│
└── data/
    ├── KO_stock_data.csv       # Raw OHLCV data (1,258 trading days)
    ├── KO_powerbi.csv          # Flat export with all indicators for Power BI
    ├── dashboard_data.json     # Processed JSON payload
    └── dashboard_data.js       # JS-wrapped data (enables local file:// loading)
```

---

## 📊 Dashboard Features

### Interactive Charts
| Chart | Description |
|---|---|
| **Price History** | Close price with MA 20, MA 50, MA 200 overlays + Bollinger Bands (±2σ) |
| **RSI 14** | Relative Strength Index with overbought (70) / oversold (30) zone lines |
| **Monthly Volume** | Monthly average daily volume bar chart (intensity-coded) |
| **Monthly Returns** | Green/red bars for each calendar month's return |
| **Return Distribution** | 30-bin histogram of daily returns across the full dataset |

### Controls
- **Range selector** — filter price chart to 1M / 3M / 6M / 1Y / All
- **Legend toggles** — click any series label to show/hide it on the price chart
- **Tooltips** — hover any chart for exact values at that date

### KPI Cards
Current price · Day change · YTD return · 5Y total return · 52-week high/low · Avg volume · Prev close

---

## ⚙️ Technical Indicators Computed

| Indicator | Formula |
|---|---|
| MA 20 / MA 50 / MA 200 | Simple moving average over N days |
| Bollinger Bands | MA 20 ± 2 × 20-day rolling std dev |
| RSI 14 | 100 − 100 / (1 + avg\_gain / avg\_loss) over 14 days |
| Daily Return | `(Close_t / Close_{t-1}) − 1` |
| Cumulative Return | `∏ (1 + Daily Return)` |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/bhargav0504/CocaCola-Stock-Dashboard.git
cd CocaCola-Stock-Dashboard
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Fetch & process data

```bash
python generate_data.py
```

> If `yfinance` can reach Yahoo Finance, real KO historical data is pulled.  
> Otherwise, the script falls back to a synthetic dataset with realistic price behavior (including the COVID-19 crash of March 2020).

### 4. Open the dashboard

Simply open `index.html` in any modern browser — no web server required.

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

---

## 📈 Power BI Integration

Import `data/KO_powerbi.csv` into Power BI Desktop:

1. **Home → Get Data → Text/CSV** → select `KO_powerbi.csv`
2. All computed columns are pre-built — just drag and drop onto the canvas
3. Suggested visuals: Line chart (Close + MA50), Bar chart (Volume), Card (Latest Price, RSI14)
4. Add a **Date slicer** for interactive filtering

### Suggested DAX Measures

```dax
Latest Price   = LASTNONBLANK(KO_powerbi[Close], 1)

YTD Return %   = DIVIDE(
    LASTNONBLANK(KO_powerbi[Close], 1) - FIRSTNONBLANK(KO_powerbi[Close], 1),
    FIRSTNONBLANK(KO_powerbi[Close], 1)
) * 100
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Data Fetching | Python · yfinance |
| Data Processing | Python · pandas · NumPy |
| Visualization (web) | Chart.js 4.4 · HTML5 · CSS3 |
| Visualization (BI) | Power BI Desktop |
| Styling | Custom dark-theme CSS (Coca-Cola brand palette) |

---

## 📦 Dependencies

```
yfinance==0.2.51
pandas==2.2.2
numpy==1.26.4
matplotlib==3.9.0
seaborn==0.13.2
```

---

## 📋 Data Dictionary

| Column | Type | Description |
|---|---|---|
| `Date` | date | Trading date (business days only) |
| `Open` | float | Opening price (USD) |
| `High` | float | Intraday high (USD) |
| `Low` | float | Intraday low (USD) |
| `Close` | float | Adjusted closing price (USD) |
| `Volume` | int | Shares traded |
| `MA20` | float | 20-day simple moving average |
| `MA50` | float | 50-day simple moving average |
| `MA200` | float | 200-day simple moving average |
| `BB_Upper` | float | Bollinger Band upper (MA20 + 2σ) |
| `BB_Lower` | float | Bollinger Band lower (MA20 − 2σ) |
| `RSI14` | float | 14-day Relative Strength Index |
| `DailyReturn` | float | Day-over-day return (decimal) |
| `CumReturn` | float | Cumulative return since first date |

---

## 📁 Output Files

| File | Purpose |
|---|---|
| `data/KO_stock_data.csv` | Raw OHLCV — clean dataset for further analysis |
| `data/KO_powerbi.csv` | All columns including indicators — direct Power BI import |
| `data/dashboard_data.json` | Structured JSON for API-based integrations |
| `data/dashboard_data.js` | Same as JSON, wrapped as a JS variable for local browser loading |

---

## 📸 Screenshots

> Open `index.html` to view the live interactive dashboard.

**Dashboard Sections:**
- Stats bar with live KPIs
- Price chart with MA overlays and Bollinger Bands
- RSI momentum indicator
- Monthly volume trends
- Monthly return calendar
- Daily return distribution histogram

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

*Built for portfolio demonstration — data is for educational purposes and not financial advice.*
