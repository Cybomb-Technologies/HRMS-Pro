import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPinIcon, Loader2 } from 'lucide-react';

const LocationViewer = ({ location, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [detailedAddress, setDetailedAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Reverse geocoding function
  const reverseGeocode = async (lat, lng) => {
    try {
      setLoadingAddress(true);
      
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data && data.address) {
        return {
          house: data.address.house_number || '',
          road: data.address.road || '',
          neighbourhood: data.address.neighbourhood || '',
          suburb: data.address.suburb || '',
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || '',
          postcode: data.address.postcode || '',
          country: data.address.country || '',
          fullAddress: data.display_name || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    } finally {
      setLoadingAddress(false);
    }
  };

  // Fetch detailed address when dialog opens
  useEffect(() => {
    if (isOpen && location && (location.latitude || location.lat) && !detailedAddress) {
      const lat = location.latitude || location.lat;
      const lng = location.longitude || location.lng;
      
      reverseGeocode(lat, lng).then(setDetailedAddress);
    }
  }, [isOpen, location, detailedAddress]);

  // Helper function to get the most detailed address
  const getDisplayAddress = (loc) => {
    return loc.address || loc.formattedAddress || `${loc.latitude || 'N/A'}, ${loc.longitude || 'N/A'}`;
  }

  if (!location || (!location.address && !location.formattedAddress && !location.latitude)) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  const displayAddress = getDisplayAddress(location);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="p-1 h-auto hover:bg-gray-100"
      >
        <div className="flex items-center space-x-1 text-xs">
          <MapPinIcon className="w-3 h-3 text-green-600" />
          <span className="max-w-20 truncate">{displayAddress}</span>
        </div>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{type} Location Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Location Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                  {location.latitude || location.lat}
                </p>
              </div>
              <div>
                <Label>Longitude</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                  {location.longitude || location.lng}
                </p>
              </div>
            </div>

            {location.accuracy && (
              <div>
                <Label>Accuracy</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                  {location.accuracy}m
                </p>
              </div>
            )}

            {/* Original Address */}
            <div>
              <Label>Location</Label>
              <p className="text-sm mt-1 p-2 bg-gray-50 rounded font-mono break-words">
                {displayAddress}
              </p>
            </div>

            {/* Detailed Address from Reverse Geocoding */}
            <div>
              <Label className="flex items-center gap-2">
                Detailed Address
                {loadingAddress && <Loader2 className="w-3 h-3 animate-spin" />}
              </Label>
              
              {detailedAddress ? (
                <div className="mt-2 space-y-2 p-3 bg-blue-50 rounded border">
                  {detailedAddress.house && (
                    <div className="flex justify-between">
                      <span className="font-medium">House No:</span>
                      <span>{detailedAddress.house}</span>
                    </div>
                  )}
                  {detailedAddress.road && (
                    <div className="flex justify-between">
                      <span className="font-medium">Street:</span>
                      <span>{detailedAddress.road}</span>
                    </div>
                  )}
                  {detailedAddress.neighbourhood && (
                    <div className="flex justify-between">
                      <span className="font-medium">Neighbourhood:</span>
                      <span>{detailedAddress.neighbourhood}</span>
                    </div>
                  )}
                  {detailedAddress.suburb && (
                    <div className="flex justify-between">
                      <span className="font-medium">Suburb:</span>
                      <span>{detailedAddress.suburb}</span>
                    </div>
                  )}
                  {detailedAddress.city && (
                    <div className="flex justify-between">
                      <span className="font-medium">City:</span>
                      <span>{detailedAddress.city}</span>
                    </div>
                  )}
                  {detailedAddress.state && (
                    <div className="flex justify-between">
                      <span className="font-medium">State:</span>
                      <span>{detailedAddress.state}</span>
                    </div>
                  )}
                  {detailedAddress.postcode && (
                    <div className="flex justify-between">
                      <span className="font-medium">Postal Code:</span>
                      <span>{detailedAddress.postcode}</span>
                    </div>
                  )}
                  {detailedAddress.country && (
                    <div className="flex justify-between">
                      <span className="font-medium">Country:</span>
                      <span>{detailedAddress.country}</span>
                    </div>
                  )}
                  
                  {/* Full formatted address */}
                  <div className="mt-3 pt-3 border-t">
                    <Label className="text-sm">Full Address:</Label>
                    <p className="text-sm mt-1 text-gray-700 break-words">
                      {detailedAddress.fullAddress}
                    </p>
                  </div>
                </div>
              ) : !loadingAddress ? (
                <div className="mt-2 p-3 bg-yellow-50 rounded border text-sm text-yellow-700">
                  Detailed address not available. Click "Fetch Detailed Address" to try.
                </div>
              ) : (
                <div className="mt-2 p-3 bg-gray-50 rounded border text-sm text-gray-600">
                  Fetching detailed address...
                </div>
              )}
            </div>

            {/* Manual fetch button */}
            {!detailedAddress && !loadingAddress && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const lat = location.latitude || location.lat;
                  const lng = location.longitude || location.lng;
                  reverseGeocode(lat, lng).then(setDetailedAddress);
                }}
              >
                Fetch Detailed Address
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LocationViewer;