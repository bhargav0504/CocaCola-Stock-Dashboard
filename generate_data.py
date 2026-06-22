"""
Coca-Cola (KO) Stock Data Fetcher
----------------------------------
Fetches historical KO stock data via yfinance and exports:
  - data/KO_stock_data.csv     raw OHLCV
  - data/dashboard_data.json   processed data for the Chart.js dashboard
  - data/KO_powerbi.csv        flattened export for Power BI
"""

import os, json
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)


def fetch_with_yfinance(ticker="KO", start="2020-01-01", end="2025-01-01"):
    try:
        import yfinance as yf
        df = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
        if df.empty:
            raise ValueError("yfinance returned empty DataFrame")
        df.index = pd.to_datetime(df.index)
        df.index.name = "Date"
        df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]
        return df
    except Exception as e:
        print(f"[warn] yfinance failed ({e}), using generated sample data")
        return None


def generate_sample_data(start="2020-01-01", end="2025-01-01"):
    """Synthetic KO-like OHLCV data using geometric Brownian motion."""
    dates = pd.bdate_range(start=start, end=end)
    np.random.seed(42)
    n = len(dates)

    # KO approximate trajectory anchors
    s0 = 57.0          # ~KO Jan-2020
    mu = 0.00018       # ~5 % annual drift
    sigma = 0.0095     # ~15 % annual vol

    log_returns = np.random.normal(mu - 0.5 * sigma**2, sigma, n)
    close = s0 * np.exp(np.cumsum(log_returns))

    # Simulate COVID crash (March 2020)
    crash = (dates >= "2020-03-02") & (dates <= "2020-03-23")
    close[crash] *= np.linspace(1.0, 0.73, crash.sum())
    recovery = (dates >= "2020-03-24") & (dates <= "2020-08-31")
    close[recovery] *= np.linspace(0.73, 0.95, recovery.sum())

    daily_range = close * np.random.uniform(0.008, 0.022, n)
    high  = close + daily_range * np.random.uniform(0.3, 0.7, n)
    low   = close - daily_range * np.random.uniform(0.3, 0.7, n)
    open_ = low + (high - low) * np.random.uniform(0.2, 0.8, n)
    volume = np.random.randint(8_000_000, 25_000_000, n).astype(float)

    df = pd.DataFrame({
        "Open": np.round(open_, 4),
        "High": np.round(high, 4),
        "Low":  np.round(low, 4),
        "Close": np.round(close, 4),
        "Volume": volume
    }, index=dates)
    df.index.name = "Date"
    return df


def compute_indicators(df):
    df = df.copy()
    df["MA20"]  = df["Close"].rolling(20).mean().round(4)
    df["MA50"]  = df["Close"].rolling(50).mean().round(4)
    df["MA200"] = df["Close"].rolling(200).mean().round(4)
    df["DailyReturn"] = df["Close"].pct_change().round(6)
    df["CumReturn"]   = (1 + df["DailyReturn"]).cumprod().round(6)
    # Bollinger Bands (20-day)
    roll_std = df["Close"].rolling(20).std()
    df["BB_Upper"] = (df["MA20"] + 2 * roll_std).round(4)
    df["BB_Lower"] = (df["MA20"] - 2 * roll_std).round(4)
    # RSI (14-day)
    delta = df["Close"].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss
    df["RSI14"] = (100 - 100 / (1 + rs)).round(2)
    return df


def build_dashboard_json(df):
    df_clean = df.dropna(subset=["MA50"])
    recent = df_clean.tail(252)        # last ~1 trading year for chart perf
    full   = df_clean                  # full series for stats

    def s(series):
        return [None if pd.isna(v) else round(float(v), 4) for v in series]

    dates_str = [d.strftime("%Y-%m-%d") for d in recent.index]

    # Summary stats
    price_now    = float(full["Close"].iloc[-1])
    price_prev   = float(full["Close"].iloc[-2])
    w52_high     = float(full["High"].tail(252).max())
    w52_low      = float(full["Low"].tail(252).min())
    avg_vol_10   = float(full["Volume"].tail(10).mean())
    ytd_start    = full[full.index.year == full.index[-1].year]["Close"].iloc[0]
    ytd_return   = (price_now / float(ytd_start) - 1) * 100
    total_return = (float(full["CumReturn"].iloc[-1]) - 1) * 100

    # Monthly returns for bar chart
    monthly = full["DailyReturn"].resample("ME").apply(lambda r: (1+r).prod()-1)
    monthly_labels = [d.strftime("%b %Y") for d in monthly.index]
    monthly_values = [round(float(v)*100, 2) for v in monthly]

    # Volume monthly average
    vol_monthly = full["Volume"].resample("ME").mean()
    vol_labels  = [d.strftime("%b %Y") for d in vol_monthly.index]
    vol_values  = [int(v) for v in vol_monthly]

    # Daily return distribution (histogram buckets)
    returns_clean = full["DailyReturn"].dropna() * 100
    counts, edges = np.histogram(returns_clean, bins=30)
    hist_labels = [f"{edges[i]:.2f}%" for i in range(len(edges)-1)]
    hist_counts = counts.tolist()

    payload = {
        "meta": {
            "ticker": "KO",
            "name": "The Coca-Cola Company",
            "last_updated": full.index[-1].strftime("%Y-%m-%d"),
            "data_start": full.index[0].strftime("%Y-%m-%d"),
            "data_end": full.index[-1].strftime("%Y-%m-%d"),
        },
        "stats": {
            "current_price": round(price_now, 2),
            "prev_close": round(price_prev, 2),
            "day_change": round(price_now - price_prev, 2),
            "day_change_pct": round((price_now / price_prev - 1) * 100, 2),
            "week52_high": round(w52_high, 2),
            "week52_low": round(w52_low, 2),
            "avg_volume_10d": int(avg_vol_10),
            "ytd_return_pct": round(ytd_return, 2),
            "total_return_pct": round(total_return, 2),
        },
        "price_chart": {
            "dates":    dates_str,
            "close":    s(recent["Close"]),
            "high":     s(recent["High"]),
            "low":      s(recent["Low"]),
            "ma20":     s(recent["MA20"]),
            "ma50":     s(recent["MA50"]),
            "ma200":    s(recent["MA200"]),
            "bb_upper": s(recent["BB_Upper"]),
            "bb_lower": s(recent["BB_Lower"]),
        },
        "rsi_chart": {
            "dates": dates_str,
            "rsi14": s(recent["RSI14"]),
        },
        "volume_chart": {
            "labels":  vol_labels,
            "volumes": vol_values,
        },
        "monthly_returns": {
            "labels": monthly_labels,
            "values": monthly_values,
        },
        "return_distribution": {
            "labels": hist_labels,
            "counts": hist_counts,
        },
    }
    return payload


def main():
    print("Fetching KO stock data…")
    df = fetch_with_yfinance()
    if df is None:
        df = generate_sample_data()

    csv_path = os.path.join(DATA_DIR, "KO_stock_data.csv")
    df.to_csv(csv_path)
    print(f"Saved raw data -> {csv_path}  ({len(df)} rows)")

    df = compute_indicators(df)

    # Power BI export
    pbi_path = os.path.join(DATA_DIR, "KO_powerbi.csv")
    df.reset_index().to_csv(pbi_path, index=False)
    print(f"Saved Power BI export -> {pbi_path}")

    # Dashboard JSON
    payload = build_dashboard_json(df)
    json_path = os.path.join(DATA_DIR, "dashboard_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Saved dashboard JSON -> {json_path}")

    # JS wrapper so the dashboard works without a web server (file:// protocol)
    js_path = os.path.join(DATA_DIR, "dashboard_data.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.DASHBOARD_DATA = ")
        json.dump(payload, f, indent=2)
        f.write(";\n")
    print(f"Saved dashboard JS   -> {js_path}")
    print("Done.")


if __name__ == "__main__":
    main()
