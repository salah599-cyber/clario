import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AssetAcquisitionFields({
  acquisitionDateDefault,
  acquisitionCostDefault,
  currentValueDefault,
}: {
  acquisitionDateDefault?: string;
  acquisitionCostDefault?: string;
  currentValueDefault?: string;
}) {
  return (
    <div className="md:col-span-2 rounded-lg border bg-muted/30 p-4">
      <div className="mb-4 space-y-1">
        <p className="text-sm font-semibold">Acquisition</p>
        <p className="text-xs text-muted-foreground">
          Record when the asset was acquired and the purchase details.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="acquisitionDate">Acquisition Date</Label>
          <Input
            id="acquisitionDate"
            name="acquisitionDate"
            type="date"
            defaultValue={acquisitionDateDefault}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
          <Input
            id="acquisitionCost"
            name="acquisitionCost"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            defaultValue={acquisitionCostDefault}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="currentValue">Current Value</Label>
          <Input
            id="currentValue"
            name="currentValue"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            defaultValue={currentValueDefault}
          />
        </div>
      </div>
    </div>
  );
}
