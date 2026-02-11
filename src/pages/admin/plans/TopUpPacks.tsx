import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShoppingCart, Edit, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface TopUpPack {
  id: string;
  name: string;
  credits_included: number;
  price: number;
}

const DEFAULT_PACKS: TopUpPack[] = [
  { id: "1", name: "Small Top-Up", credits_included: 10, price: 4.99 },
  { id: "2", name: "Medium Top-Up", credits_included: 25, price: 9.99 },
  { id: "3", name: "Large Top-Up", credits_included: 50, price: 19.99 },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
}

export default function TopUpPacksPage() {
  const [packs, setPacks] = useState<TopUpPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<TopUpPack | null>(null);
  const [editName, setEditName] = useState("");
  const [editCredits, setEditCredits] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPacks();
  }, []);

  async function fetchPacks() {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 400));
      setPacks([...DEFAULT_PACKS]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching top-up packs:", err);
      setError("Failed to load top-up packs: " + message);
    } finally {
      setIsLoading(false);
    }
  }

  function openEditModal(pack: TopUpPack) {
    setEditingPack(pack);
    setEditName(pack.name);
    setEditCredits(String(pack.credits_included));
    setEditPrice(String(pack.price));
    setEditModalOpen(true);
  }

  function closeEditModal() {
    setEditModalOpen(false);
    setEditingPack(null);
    setEditName("");
    setEditCredits("");
    setEditPrice("");
  }

  async function handleSaveChanges() {
    if (!editingPack) return;
    const credits = parseInt(editCredits, 10);
    const price = parseFloat(editPrice);
    if (!editName.trim()) {
      toast.error("Pack name is required");
      return;
    }
    if (isNaN(credits) || credits < 1) {
      toast.error("Credits included must be at least 1");
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error("Price must be 0 or greater");
      return;
    }

    try {
      setIsSaving(true);
      // TODO: Replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPacks((prev) =>
        prev.map((p) =>
          p.id === editingPack.id
            ? {
                ...p,
                name: editName.trim(),
                credits_included: credits,
                price,
              }
            : p
        )
      );
      toast.success("Top-up pack updated");
      closeEditModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to save: " + message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Top-Up Packs</h1>
        <p className="text-muted-foreground mt-1">
          Manage one-time credit purchase options.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pack Name</TableHead>
                  <TableHead>Credits Included</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packs.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell className="font-medium">{pack.name}</TableCell>
                    <TableCell>{pack.credits_included}</TableCell>
                    <TableCell>{formatPrice(pack.price)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(pack)}
                        aria-label={`Edit ${pack.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Top-Up Pack Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Edit Top-Up Pack
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Small Top-Up"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-credits">Credits included</Label>
              <Input
                id="edit-credits"
                type="number"
                min="1"
                value={editCredits}
                onChange={(e) => setEditCredits(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="e.g. 4.99"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              <span className={isSaving ? "ml-2" : ""}>Save changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
