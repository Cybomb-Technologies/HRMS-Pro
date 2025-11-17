// components/settings/sections/GeneralSettings.jsx
import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Upload, Trash2, Save, MapPin } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";

const GeneralSettings = () => {
  const { settingsData, updateSettings, saveSettings, loading, handleAction } =
    useSettings();
  const logoInputRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        handleAction(
          "File too large - please select an image smaller than 5MB"
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ logo: reader.result });
        handleAction("Logo updated - click Save to apply");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    saveSettings("General");
  };

  const handleAddressChange = (field, value) => {
    const updatedAddress = {
      ...settingsData.address,
      [field]: value,
    };
    updateSettings({ address: updatedAddress });
  };

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold">
          General Settings
        </CardTitle>
        <p className="text-muted-foreground">
          Manage your company's basic information and branding
        </p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="space-y-4">
          <Label className="text-base">Company Branding</Label>
          <div className="flex items-start space-x-6 p-4 border rounded-lg bg-muted/20">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-background">
                {settingsData.logo ? (
                  <img
                    src={settingsData.logo}
                    alt="Company Logo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-medium">Company Logo</h4>
                <p className="text-sm text-muted-foreground">
                  Upload your company logo. Recommended size: 240x240px, max 5MB
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => logoInputRef.current.click()}
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload Logo
                </Button>
                {settingsData.logo && (
                  <Button
                    variant="outline"
                    onClick={() => updateSettings({ logo: "" })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={settingsData.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              placeholder="Enter company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={settingsData.website}
              onChange={(e) => updateSettings({ website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <Label className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Company Address
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={settingsData.address?.street || ""}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder="Enter street address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={settingsData.address?.city || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={settingsData.address?.state || ""}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                placeholder="Enter state or province"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                value={settingsData.address?.zipCode || ""}
                onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                placeholder="Enter ZIP or postal code"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={settingsData.address?.country || "India"}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;
