// components/settings/sections/LocalizationSettings.jsx
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Save, Search } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import { cn } from "@/lib/utils";
import HolidayCalendarModal from "./HolidayCalendarModal";

// --- Utility Functions for Dynamic Data ---

const PRIORITY_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "SAR",
  "SGD",
  "AUD",
  "CAD",
  "JPY",
  "CNY",
  "HKD",
];

// Try to extract symbol by formatting 0 and removing digits
const getCurrencySymbol = (code) => {
  try {
    // Use en-IN to display symbols in a format familiar to Indian users
    const nf = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const formatted = nf.format(0); // e.g., "₹0" or "$0"
    // Remove digits, punctuation and whitespace that belong to the zero
    // Keep leftover as symbol. This is heuristic but works well for most currencies.
    const symbol = formatted
      .replace(/[0\s\d.,\u200E\u200F\u202A-\u202E]/g, "")
      .trim();
    return symbol || code;
  } catch (err) {
    return code;
  }
};

// Generate currencies list dynamically using Intl.supportedValuesOf if available.
// Fallback to a reasonable static list if not available.
const getCurrencies = () => {
  let codes = [];
  if (
    typeof Intl !== "undefined" &&
    typeof Intl.supportedValuesOf === "function"
  ) {
    try {
      codes = Intl.supportedValuesOf("currency"); // array of ISO currency codes
    } catch (err) {
      // unexpected - fall back below
      codes = [];
    }
  }

  if (!codes || codes.length === 0) {
    // Fallback list (includes commonly used global currencies and a few regional ones)
    codes = [
      "INR",
      "USD",
      "EUR",
      "GBP",
      "AED",
      "SAR",
      "SGD",
      "AUD",
      "CAD",
      "JPY",
      "CNY",
      "HKD",
      "NZD",
      "CHF",
      "SEK",
      "NOK",
      "DKK",
      "ZAR",
      "BRL",
      "MXN",
      "KRW",
      "IDR",
      "MYR",
      "THB",
      "PHP",
      "PKR",
      "EGP",
      "NGN",
    ];
  }

  // Build objects with label/value and symbol; prioritize some currencies on top
  // Remove duplicates and sort alphabetically after prioritization.
  const uniqueCodes = Array.from(new Set(codes));

  const priority = PRIORITY_CURRENCIES.filter((c) => uniqueCodes.includes(c));
  const others = uniqueCodes.filter((c) => !priority.includes(c)).sort();

  const ordered = [...priority, ...others];

  const mapped = ordered.map((code) => {
    const symbol = getCurrencySymbol(code);
    return {
      value: `${code} (${symbol})`, // this matches your previous value format
      label: `${code} (${symbol})`,
      code,
      symbol,
    };
  });

  return mapped;
};

// --- Main Component ---

const LocalizationSettings = () => {
  const { settingsData, updateSettings, saveSettings, loading, handleAction } =
    useSettings();

  // State for timezone search input
  const [timezoneSearch, setTimezoneSearch] = useState("");

  // Generate dynamic lists only once using useMemo
  const allTimezones = useMemo(() => {
    // Keep your original getTimezones behavior - inline here for clarity
    if (typeof Intl !== "undefined" && Intl.supportedValuesOf) {
      try {
        const timeZones = Intl.supportedValuesOf("timeZone");
        return timeZones
          .map((zone) => {
            const date = new Date();
            const formatter = new Intl.DateTimeFormat("en-US", {
              timeZone: zone,
              timeZoneName: "shortOffset",
            });
            const offset =
              formatter
                .formatToParts(date)
                .find((part) => part.type === "timeZoneName")?.value || "UTC";
            return {
              value: zone,
              label: `(${offset}) ${zone
                .replace(/_/g, " ")
                .replace("/", " / ")}`,
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));
      } catch (err) {
        return [{ value: "UTC", label: "UTC" }];
      }
    }
    return [{ value: "UTC", label: "UTC" }];
  }, []);

  const currencies = useMemo(getCurrencies, []);

  // Filter timezones based on search input
  const filteredTimezones = allTimezones.filter((tz) =>
    tz.label.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const handleSave = async () => {
    console.log(
      "💾 LocalizationSettings - Saving settings with currency:",
      settingsData.defaultCurrency
    );

    try {
      await saveSettings("Localization");

      // Trigger currency refresh across the app
      window.dispatchEvent(
        new CustomEvent("currencyUpdated", {
          detail: settingsData.defaultCurrency,
        })
      );

      console.log(
        "✅ LocalizationSettings - Settings saved successfully, currency update event dispatched"
      );
    } catch (error) {
      console.error("❌ LocalizationSettings - Error saving settings:", error);
    }
  };

  // Handle currency change with detailed logging
  const handleCurrencyChange = (value) => {
    console.log("🔄 LocalizationSettings - Currency changed to:", value);

    // Parse the currency value to extract code and symbol
    const currencyMatch = value.match(/([A-Z]{3})\s*\(([^)]+)\)/);
    if (currencyMatch) {
      const currencyCode = currencyMatch[1];
      const currencySymbol = currencyMatch[2];

      console.log("📊 LocalizationSettings - Parsed currency:", {
        code: currencyCode,
        symbol: currencySymbol,
        display: value,
      });

      updateSettings({ defaultCurrency: value });
    } else {
      console.warn("⚠️ LocalizationSettings - Invalid currency format:", value);
      // Fallback to INR
      updateSettings({ defaultCurrency: "INR (₹)" });
    }
  };

  // Get current currency display value
  const getCurrentCurrencyValue = () => {
    if (
      typeof settingsData.defaultCurrency === "object" &&
      settingsData.defaultCurrency.display
    ) {
      console.log(
        "📊 LocalizationSettings - Current currency (object):",
        settingsData.defaultCurrency.display
      );
      return settingsData.defaultCurrency.display;
    }

    if (typeof settingsData.defaultCurrency === "string") {
      console.log(
        "📊 LocalizationSettings - Current currency (string):",
        settingsData.defaultCurrency
      );
      return settingsData.defaultCurrency;
    }

    console.log("📊 LocalizationSettings - Using default currency: INR (₹)");
    return "INR (₹)";
  };

  // Log current settings on mount and updates
  React.useEffect(() => {
    console.log("🏢 LocalizationSettings - Current settings:", {
      timezone: settingsData.defaultTimezone,
      currency: settingsData.defaultCurrency,
      currencyDisplay: getCurrentCurrencyValue(),
    });
  }, [settingsData.defaultTimezone, settingsData.defaultCurrency]);

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold">
          Localization Settings
        </CardTitle>
        <p className="text-muted-foreground">
          Configure regional and language preferences
        </p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Timezone with Search (Dynamic) */}
          <div className="space-y-2">
            <Label htmlFor="defaultTimezone">Default Timezone</Label>
            <Select
              value={settingsData.defaultTimezone}
              onValueChange={(value) => {
                console.log(
                  "🕐 LocalizationSettings - Timezone changed to:",
                  value
                );
                updateSettings({ defaultTimezone: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a timezone..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <div className="p-2 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search timezone..."
                      className="pl-8"
                      value={timezoneSearch}
                      onChange={(e) => setTimezoneSearch(e.target.value)}
                    />
                  </div>
                </div>
                <SelectGroup>
                  {filteredTimezones.length > 0 ? (
                    filteredTimezones.map((tz) => (
                      <SelectItem
                        key={tz.value}
                        value={tz.value}
                        className={cn(
                          settingsData.defaultTimezone === tz.value &&
                            "font-bold bg-accent"
                        )}
                      >
                        {tz.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No timezones found.
                    </div>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Default Currency (Dynamic) */}
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">Default Currency</Label>
            <Select
              value={getCurrentCurrencyValue()}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a currency..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectGroup>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                • Changing currency will affect all future payroll calculations
              </p>
              <p>• Historical payroll data will maintain original amounts</p>
              <p>• Current month payroll will use converted amounts</p>
            </div>
          </div>
        </div>

        {/* Currency Information Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">
            Currency Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Current Currency:</span>{" "}
              <span className="text-blue-700">{getCurrentCurrencyValue()}</span>
            </div>
            <div>
              <span className="font-medium">Effect:</span>{" "}
              <span className="text-blue-700">Applies to new payroll runs</span>
            </div>
          </div>
        </div>

        {/* Holiday Calendar Dialog/Modal Trigger */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <h4 className="font-medium flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Holiday Calendars
            </h4>
            <p className="text-sm text-muted-foreground">
              Manage company holidays and observances
            </p>
          </div>
          {/* The trigger for the new modal */}
          <HolidayCalendarModal />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalizationSettings;
