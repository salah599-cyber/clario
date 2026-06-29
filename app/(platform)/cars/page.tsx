import Link from "next/link";
import { PlatformHeader } from "@/components/platform/platform-header";
import { AddLinkButton } from "@/components/platform/add-link-button";
import { RowActions } from "@/components/platform/row-actions";
import { listCars, deleteCar } from "@/lib/actions/cars";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";
import { ASSET_STATUS_LABELS } from "@/lib/labels";
import { formatMoney, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatPlate(plateCode: string | null, plateNumber: string) {
  return [plateCode, plateNumber].filter(Boolean).join(" ") || plateNumber;
}

export default async function CarsPage() {
  const ctx = await requireModuleAccess("CARS");
  const cars = await listCars();
  const showAdd = canWrite(ctx, "CARS");

  return (
    <>
      <PlatformHeader title="Cars" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Oman Vehicles</CardTitle>
              <CardDescription>
                Owned cars registered in Oman — Motor Vehicle License (Mulkia) details and documents.
              </CardDescription>
            </div>
            {showAdd ? <AddLinkButton href="/cars/new" label="Register Vehicle" /> : null}
          </CardHeader>
          <CardContent>
            {cars.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vehicles registered yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead>Updated</TableHead>
                    {showAdd ? <TableHead className="w-[60px]">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cars.map((car) => (
                    <TableRow key={car.id}>
                      <TableCell className="font-medium">
                        <Link href={"/cars/" + car.id} className="hover:underline">
                          {car.name}
                        </Link>
                      </TableCell>
                      <TableCell>{formatPlate(car.plateCode, car.plateNumber)}</TableCell>
                      <TableCell>
                        {car.make} {car.model}
                        {car.modelYear ? " (" + car.modelYear + ")" : ""}
                      </TableCell>
                      <TableCell>
                        {car.wilayat}, {car.governorate}
                      </TableCell>
                      <TableCell>{car.entity.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ASSET_STATUS_LABELS[car.status] ?? car.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(car.currentValue, car.currency)}</TableCell>
                      <TableCell>{car.documents.length}</TableCell>
                      <TableCell>{formatDate(car.updatedAt)}</TableCell>
                      {showAdd ? (
                        <TableCell>
                          <RowActions
                            editHref={"/cars/" + car.id + "/edit"}
                            itemId={car.id}
                            itemLabel={car.name}
                            deleteAction={deleteCar}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
