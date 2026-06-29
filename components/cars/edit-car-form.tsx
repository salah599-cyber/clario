"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCar } from "@/lib/actions/cars";
import { OMAN_GOVERNORATES, getWilayatsForGovernorate } from "@/lib/data/oman-locations";
import {
  ASSET_STATUS_LABELS,
  VEHICLE_BODY_TYPE_LABELS,
  VEHICLE_CLASS_LABELS,
  VEHICLE_FUEL_TYPE_LABELS,
} from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateInput, formatDecimalInput } from "@/lib/format";

type EntityOption = { id: string; name: string };

type CarRecord = {
  id: string;
  name: string;
  plateNumber: string;
  plateCode: string | null;
  governorate: string;
  wilayat: string;
  make: string;
  model: string;
  modelYear: number | null;
  color: string | null;
  vehicleClass: string | null;
  bodyType: string | null;
  fuelType: string | null;
  chassisNumber: string | null;
  engineNumber: string | null;
  mulkiaNumber: string | null;
  registeredOwner: string | null;
  registrationIssueDate: Date | null;
  registrationExpiryDate: Date | null;
  insuranceCompany: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiryDate: Date | null;
  entityId: string;
  status: string;
  currency: string;
  ownershipPct: { toString(): string };
  acquisitionDate: Date | null;
  acquisitionCost: { toString(): string } | null;
  currentValue: { toString(): string } | null;
  notes: string | null;
};

export function EditCarForm({ car, entities }: { car: CarRecord; entities: EntityOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [governorate, setGovernorate] = useState<string>(car.governorate);
  const [wilayat, setWilayat] = useState(car.wilayat);
  const [status, setStatus] = useState(car.status);
  const [entityId, setEntityId] = useState(car.entityId);
  const [vehicleClass, setVehicleClass] = useState(car.vehicleClass ?? "PRIVATE");
  const [bodyType, setBodyType] = useState(car.bodyType ?? "SUV");
  const [fuelType, setFuelType] = useState(car.fuelType ?? "PETROL");
  const [currency, setCurrency] = useState(car.currency);

  const wilayats = useMemo(() => getWilayatsForGovernorate(governorate), [governorate]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("governorate", governorate);
    formData.set("wilayat", wilayat);
    formData.set("status", status);
    formData.set("entityId", entityId);
    formData.set("vehicleClass", vehicleClass);
    formData.set("bodyType", bodyType);
    formData.set("fuelType", fuelType);
    formData.set("currency", currency);

    startTransition(async () => {
      try {
        await updateCar(car.id, formData);
        router.push("/cars/" + car.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update vehicle.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Motor Vehicle License details</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" name="name" required defaultValue={car.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plateNumber">Plate Number</Label>
            <Input id="plateNumber" name="plateNumber" required defaultValue={car.plateNumber} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plateCode">Plate Code</Label>
            <Input id="plateCode" name="plateCode" defaultValue={car.plateCode ?? ""} />
          </div>

          <div className="space-y-2">
            <Label>Governorate</Label>
            <Select value={governorate} onValueChange={(v) => { setGovernorate(v); setWilayat(getWilayatsForGovernorate(v)[0] ?? ""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OMAN_GOVERNORATES.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Wilayat</Label>
            <Select value={wilayat} onValueChange={setWilayat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {wilayats.map((w) => (<SelectItem key={w} value={w}>{w}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input id="make" name="make" required defaultValue={car.make} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" name="model" required defaultValue={car.model} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelYear">Model Year</Label>
            <Input id="modelYear" name="modelYear" type="number" min="1980" max="2100" defaultValue={car.modelYear ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" defaultValue={car.color ?? ""} />
          </div>

          <div className="space-y-2">
            <Label>Vehicle Class</Label>
            <Select value={vehicleClass} onValueChange={setVehicleClass}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VEHICLE_CLASS_LABELS).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Body Type</Label>
            <Select value={bodyType} onValueChange={setBodyType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VEHICLE_BODY_TYPE_LABELS).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fuel Type</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VEHICLE_FUEL_TYPE_LABELS).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mulkiaNumber">Mulkia / License Number</Label>
            <Input id="mulkiaNumber" name="mulkiaNumber" defaultValue={car.mulkiaNumber ?? ""} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="chassisNumber">Chassis Number (VIN)</Label>
            <Input id="chassisNumber" name="chassisNumber" defaultValue={car.chassisNumber ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="engineNumber">Engine Number</Label>
            <Input id="engineNumber" name="engineNumber" defaultValue={car.engineNumber ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registeredOwner">Registered Owner</Label>
            <Input id="registeredOwner" name="registeredOwner" defaultValue={car.registeredOwner ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationIssueDate">Registration Issue Date</Label>
            <Input id="registrationIssueDate" name="registrationIssueDate" type="date" defaultValue={formatDateInput(car.registrationIssueDate)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationExpiryDate">Registration Expiry</Label>
            <Input id="registrationExpiryDate" name="registrationExpiryDate" type="date" defaultValue={formatDateInput(car.registrationExpiryDate)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insuranceCompany">Insurance Company</Label>
            <Input id="insuranceCompany" name="insuranceCompany" defaultValue={car.insuranceCompany ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurancePolicyNumber">Insurance Policy Number</Label>
            <Input id="insurancePolicyNumber" name="insurancePolicyNumber" defaultValue={car.insurancePolicyNumber ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceExpiryDate">Insurance Expiry</Label>
            <Input id="insuranceExpiryDate" name="insuranceExpiryDate" type="date" defaultValue={formatDateInput(car.insuranceExpiryDate)} />
          </div>

          <div className="space-y-2">
            <Label>Entity</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {entities.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_STATUS_LABELS).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["OMR", "USD", "EUR", "GBP", "AED"].map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownershipPct">Ownership %</Label>
            <Input id="ownershipPct" name="ownershipPct" type="number" step="0.01" min="0" max="100" defaultValue={formatDecimalInput(car.ownershipPct)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acquisitionDate">Acquisition Date</Label>
            <Input id="acquisitionDate" name="acquisitionDate" type="date" defaultValue={formatDateInput(car.acquisitionDate)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
            <Input id="acquisitionCost" name="acquisitionCost" type="number" step="0.01" min="0" defaultValue={formatDecimalInput(car.acquisitionCost)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentValue">Current Value</Label>
            <Input id="currentValue" name="currentValue" type="number" step="0.01" min="0" defaultValue={formatDecimalInput(car.currentValue)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={car.notes ?? ""} />
          </div>

          {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Changes"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
