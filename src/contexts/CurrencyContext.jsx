import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

const CurrencyContext = createContext();

// Exchange rates relative to INR (base currency)
const EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  SAR: 0.045,
  SGD: 0.016,
  AUD: 0.018,
  CAD: 0.016,
  JPY: 1.78,
  CNY: 0.087,
  HKD: 0.094,
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState({
    code: "INR",
    symbol: "₹",
    display: "INR (₹)",
    exchangeRate: 1,
  });
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState(EXCHANGE_RATES);

  // Fetch company currency settings
  const fetchCurrencySettings = async () => {
    try {
      setLoading(true);
      const API_BASE =
        process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";
      const token = localStorage.getItem("hrms_token");

      if (!token) {
        console.warn("No token found, using default currency");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/settings/company/timezone`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "🔄 Currency Context - Fetched currency settings:",
          data.data.currency
        );

        if (data.data.currency) {
          // Handle both string and object formats
          let newCurrency;
          if (typeof data.data.currency === "string") {
            const currencyMatch = data.data.currency.match(
              /([A-Z]{3})\s*\(([^)]+)\)/
            );
            if (currencyMatch) {
              newCurrency = {
                code: currencyMatch[1],
                symbol: currencyMatch[2],
                display: data.data.currency,
                exchangeRate: EXCHANGE_RATES[currencyMatch[1]] || 1,
              };
            } else {
              newCurrency = {
                code: "INR",
                symbol: "₹",
                display: "INR (₹)",
                exchangeRate: 1,
              };
            }
          } else if (data.data.currency.code) {
            newCurrency = {
              code: data.data.currency.code,
              symbol: data.data.currency.symbol,
              display:
                data.data.currency.display ||
                `${data.data.currency.code} (${data.data.currency.symbol})`,
              exchangeRate:
                data.data.currency.exchangeRate ||
                EXCHANGE_RATES[data.data.currency.code] ||
                1,
            };
          } else {
            newCurrency = {
              code: "INR",
              symbol: "₹",
              display: "INR (₹)",
              exchangeRate: 1,
            };
          }

          setCurrency(newCurrency);
          console.log("✅ Currency Context - Currency set to:", newCurrency);
        } else {
          console.warn(
            "⚠️ Currency Context - No currency data found, using default"
          );
        }

        if (data.data.exchangeRates) {
          setExchangeRates(data.data.exchangeRates);
        }
      } else {
        console.warn(
          "⚠️ Currency Context - Failed to fetch currency settings, using default INR"
        );
      }
    } catch (error) {
      console.error(
        "❌ Currency Context - Error fetching currency settings:",
        error
      );
      toast({
        title: "Currency Error",
        description:
          "Failed to load currency settings. Using default currency.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Convert amount from INR to current currency
  const convertAmount = (amountInINR) => {
    if (!amountInINR || isNaN(amountInINR)) {
      console.warn("⚠️ Currency Conversion - Invalid amount:", amountInINR);
      return 0;
    }

    const numericAmount = parseFloat(amountInINR);
    const rate = currency.exchangeRate || EXCHANGE_RATES[currency.code] || 1;
    const converted = numericAmount * rate;

    console.log(
      `🔄 Currency Conversion: ${numericAmount} INR → ${converted.toFixed(2)} ${
        currency.code
      } (Rate: ${rate})`
    );

    return converted;
  };

  // Convert amount from current currency to INR
  const convertToINR = (amountInCurrentCurrency) => {
    if (!amountInCurrentCurrency || isNaN(amountInCurrentCurrency)) {
      console.warn(
        "⚠️ Currency Conversion to INR - Invalid amount:",
        amountInCurrentCurrency
      );
      return 0;
    }

    const numericAmount = parseFloat(amountInCurrentCurrency);
    const rate = currency.exchangeRate || EXCHANGE_RATES[currency.code] || 1;
    const converted = numericAmount / rate;

    console.log(
      `🔄 Currency Conversion to INR: ${numericAmount} ${
        currency.code
      } → ${converted.toFixed(2)} INR (Rate: ${rate})`
    );

    return converted;
  };

  // Format amount with currency symbol (with conversion)
  const formatAmount = (amountInINR, decimals = 2) => {
    const numericAmount =
      typeof amountInINR === "number"
        ? amountInINR
        : parseFloat(amountInINR) || 0;

    // For display purposes, we'll show the converted amount
    const convertedAmount = convertAmount(numericAmount);

    const formatted = `${currency.symbol} ${convertedAmount.toFixed(decimals)}`;
    console.log(`💰 Format Amount: ${numericAmount} INR → ${formatted}`);

    return formatted;
  };

  // Format amount without conversion (for display only - changes symbol but keeps amount same)
  const formatAmountWithoutConversion = (amount, decimals = 2) => {
    const numericAmount =
      typeof amount === "number" ? amount : parseFloat(amount) || 0;
    const formatted = `${currency.symbol} ${numericAmount.toFixed(decimals)}`;
    console.log(
      `💰 Format Amount (No Conversion): ${numericAmount} → ${formatted}`
    );
    return formatted;
  };

  // Format amount for historical data (uses payroll's original currency)
  const formatHistoricalAmount = (
    originalAmountINR,
    payrollCurrency = null,
    currentMonth = false
  ) => {
    const numericAmount =
      typeof originalAmountINR === "number"
        ? originalAmountINR
        : parseFloat(originalAmountINR) || 0;

    if (currentMonth) {
      // Current month: show converted amount using current currency
      return formatAmount(numericAmount);
    } else {
      // Historical data: show in original currency if available
      if (payrollCurrency && payrollCurrency.code) {
        const historicalRate =
          payrollCurrency.exchangeRate ||
          EXCHANGE_RATES[payrollCurrency.code] ||
          1;
        const historicalAmount = numericAmount * historicalRate;
        const formatted = `${payrollCurrency.symbol} ${historicalAmount.toFixed(
          2
        )}`;
        console.log(
          `📊 Historical Amount: ${numericAmount} INR displayed as ${formatted} (original currency: ${payrollCurrency.code})`
        );
        return formatted;
      } else {
        // Fallback: show with current symbol but note it's historical
        const formatted = formatAmountWithoutConversion(numericAmount);
        console.log(
          `📊 Historical Amount: ${numericAmount} INR displayed as ${formatted} (using current currency for historical data)`
        );
        return formatted;
      }
    }
  };

  // Get current exchange rate
  const getExchangeRate = () => {
    return currency.exchangeRate || EXCHANGE_RATES[currency.code] || 1;
  };

  // Get all exchange rates
  const getAllExchangeRates = () => {
    return exchangeRates;
  };

  // Refresh currency settings
  const refreshCurrency = async () => {
    console.log("🔄 Currency Context - Manual refresh triggered");
    await fetchCurrencySettings();
  };

  // Listen for currency updates from settings
  useEffect(() => {
    const handleCurrencyUpdate = (event) => {
      console.log(
        "🔄 Currency Context - Received currency update event:",
        event.detail
      );
      if (event.detail) {
        setCurrency((prev) => ({
          ...prev,
          ...event.detail,
        }));
      }
    };

    window.addEventListener("currencyUpdated", handleCurrencyUpdate);

    return () => {
      window.removeEventListener("currencyUpdated", handleCurrencyUpdate);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCurrencySettings();
  }, []);

  const value = {
    currency,
    loading,
    convertAmount,
    convertToINR,
    formatAmount,
    formatAmountWithoutConversion,
    formatHistoricalAmount,
    getExchangeRate,
    getAllExchangeRates,
    refreshCurrency,
    exchangeRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
