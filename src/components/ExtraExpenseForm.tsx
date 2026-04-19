import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export interface AdditionalExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

const EXPENSES_KEY = "driver_extra_expenses";

export function getExtraExpenses(): AdditionalExpense[] {
  const data = localStorage.getItem(EXPENSES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveExtraExpense(expense: AdditionalExpense) {
  const list = getExtraExpenses();
  list.unshift(expense);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
}

export function deleteExtraExpense(id: string) {
  const list = getExtraExpenses().filter((e) => e.id !== id);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
}

interface Props {
  onSave: () => void;
}

const CATEGORIES = ["Manutenção", "Pedágio", "Alimentação", "Lavagem", "Multa", "Outros"];

export function ExtraExpenseForm({ onSave }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Outros");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveExtraExpense({
      id: crypto.randomUUID(),
      date,
      description,
      amount: Number(amount),
      category,
    });
    onSave();
    setDescription("");
    setAmount("");
    toast.success("Gasto adicional registrado!");
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5 text-warning" />
          Gasto Adicional
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Input placeholder="Ex: Troca de óleo" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
            <Input type="number" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={!description || !amount} className="col-span-2 mt-2 gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Gasto
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
