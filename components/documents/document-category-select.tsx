"use client";

import { useState, useTransition } from "react";
import { addDocumentCategory } from "@/lib/actions/document-categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export type DocumentCategoryOption = { id: string; name: string };

export function DocumentCategorySelect({
  categories,
  value,
  onValueChange,
  onCategoryAdded,
  canAdd = true,
}: {
  categories: DocumentCategoryOption[];
  value: string;
  onValueChange: (value: string) => void;
  onCategoryAdded?: (category: DocumentCategoryOption) => void;
  canAdd?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAddCategory() {
    setError(null);
    startTransition(async () => {
      try {
        const category = await addDocumentCategory(newCategoryName);
        onCategoryAdded?.(category);
        onValueChange(category.id);
        setNewCategoryName("");
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add category.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {canAdd ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="Add document category">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Document Category</DialogTitle>
              <DialogDescription>Create a new category for organizing documents.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="newDocumentCategory">Category name</Label>
              <Input
                id="newDocumentCategory"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Insurance"
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddCategory} disabled={pending || !newCategoryName.trim()}>
                {pending ? "Adding..." : "Add Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
