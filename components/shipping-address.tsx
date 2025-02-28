"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2, Save, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Country, State } from 'country-state-city'
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Address {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface ShippingAddressProps {
  onComplete?: () => void;
}

const DEFAULT_COUNTRY = "US"

export default function ShippingAddress({ onComplete }: ShippingAddressProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null)

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<Address>({
    defaultValues: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: DEFAULT_COUNTRY
    }
  })

  const selectedCountry = watch('country')

  // Memoize the full lists
  const countries = useMemo(() => Country.getAllCountries(), [])
  const states = useMemo(
    () => selectedCountry ? State.getStatesOfCountry(selectedCountry) : [],
    [selectedCountry]
  )

  useEffect(() => {
    fetchAddress()
  }, [])

  const fetchAddress = async () => {
    try {
      const response = await fetch('/api/shipping-address')
      if (!response.ok) {
        if (response.status === 404) {
          // If no address exists yet, enable editing mode
          setIsEditing(true)
          setIsLoading(false)
          return
        }
        throw new Error('Failed to fetch address')
      }
      const data = await response.json()
      setCurrentAddress(data)
      // Reset form with current values
      reset({
        addressLine1: data.addressLine1 || '',
        addressLine2: data.addressLine2 || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || '',
        country: data.country || DEFAULT_COUNTRY
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error fetching address:', error)
      toast.error('Failed to load address', {
        description: 'Please try again or contact support if the problem persists.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit: SubmitHandler<Address> = async (data) => {
    setIsSaving(true)
    try {
      // Convert empty string to null for addressLine2
      const formattedData = {
        ...data,
        addressLine2: data.addressLine2 || null
      };

      const response = await fetch('/api/shipping-address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      })

      const responseData = await response.json().catch(() => ({ error: 'Failed to parse response' }));
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update address');
      }

      setCurrentAddress(data)
      setIsEditing(false)
      toast.success('Address saved successfully')
      onComplete?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save address';
      console.error('Error updating address:', {
        error,
        message: errorMessage,
        data: JSON.stringify(data, null, 2)
      });
      toast.error('Failed to save address', {
        description: 'Please try again or contact support if the problem persists.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (!isEditing && currentAddress) {
    const countryName = Country.getCountryByCode(currentAddress.country)?.name || currentAddress.country
    const stateName = State.getStateByCodeAndCountry(currentAddress.state, currentAddress.country)?.name || currentAddress.state

    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="space-y-6 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 group relative"
      >
        <div className="space-y-1">
          <p>{currentAddress.addressLine1}</p>
          {currentAddress.addressLine2 && <p>{currentAddress.addressLine2}</p>}
          <p>{currentAddress.city}, {stateName} {currentAddress.postalCode}</p>
          <p>{countryName}</p>
        </div>
        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 className="size-4 text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="addressLine1">
              Street Address <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="addressLine1"
              control={control}
              rules={{ required: "Street address is required" }}
              render={({ field }) => (
                <Input
                  id="addressLine1"
                  {...field}
                  className="mt-1.5"
                />
              )}
            />
            {errors.addressLine1 && <p className="text-destructive text-xs mt-1">{errors.addressLine1.message}</p>}
          </div>

          <div>
            <Label htmlFor="addressLine2">
              Apartment, suite, etc.
            </Label>
            <Controller
              name="addressLine2"
              control={control}
              render={({ field }) => (
                <Input
                  id="addressLine2"
                  {...field}
                  className="mt-1.5"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="country"
                control={control}
                rules={{ required: "Country is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset state when country changes
                      setValue('state', '');
                    }}
                    value={field.value}
                  >
                    <SelectTrigger id="country" className="mt-1.5">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {countries.map((country) => (
                          <SelectItem key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.country && <p className="text-destructive text-xs mt-1">{errors.country.message}</p>}
            </div>

            <div>
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="state"
                control={control}
                rules={{ required: "State is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCountry}
                  >
                    <SelectTrigger id="state" className="mt-1.5">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {states.map((state) => (
                          <SelectItem key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.state && <p className="text-destructive text-xs mt-1">{errors.state.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="city"
                control={control}
                rules={{ required: "City is required" }}
                render={({ field }) => (
                  <Input
                    id="city"
                    {...field}
                    className="mt-1.5"
                  />
                )}
              />
              {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <Label htmlFor="postalCode">
                Zip Code <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="postalCode"
                control={control}
                rules={{
                  required: "Zip code is required",
                  pattern: {
                    value: /^\d{5}(-\d{4})?$/,
                    message: "Invalid zip code format"
                  }
                }}
                render={({ field }) => (
                  <Input
                    id="postalCode"
                    {...field}
                    className="mt-1.5"
                    placeholder="12345"
                  />
                )}
              />
              {errors.postalCode && <p className="text-destructive text-xs mt-1">{errors.postalCode.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {currentAddress && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsEditing(false)
                // Reset form to current address
                reset({
                  addressLine1: currentAddress.addressLine1,
                  addressLine2: currentAddress.addressLine2 || '',
                  city: currentAddress.city,
                  state: currentAddress.state,
                  postalCode: currentAddress.postalCode,
                  country: currentAddress.country
                })
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Address
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 