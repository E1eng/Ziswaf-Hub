"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { updateInstitutionProfile } from "@/lib/institutions";
import { toast } from "sonner";

interface Initial {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [bankName, setBankName] = useState(initial.bank_name ?? "");
  const [bankAccountName, setBankAccountName] = useState(initial.bank_account_name ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(initial.bank_account_number ?? "");

  const isDirty =
    name !== initial.name ||
    email !== (initial.email ?? "") ||
    phone !== (initial.phone ?? "") ||
    address !== (initial.address ?? "") ||
    website !== (initial.website ?? "") ||
    bankName !== (initial.bank_name ?? "") ||
    bankAccountName !== (initial.bank_account_name ?? "") ||
    bankAccountNumber !== (initial.bank_account_number ?? "");

  function handleReset() {
    setName(initial.name);
    setEmail(initial.email ?? "");
    setPhone(initial.phone ?? "");
    setAddress(initial.address ?? "");
    setWebsite(initial.website ?? "");
    setBankName(initial.bank_name ?? "");
    setBankAccountName(initial.bank_account_name ?? "");
    setBankAccountNumber(initial.bank_account_number ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || pending) return;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Format email tidak valid");
      return;
    }

    startTransition(async () => {
      const res = await updateInstitutionProfile({
        institutionId: initial.id,
        name,
        email,
        phone,
        address,
        website,
        bankName,
        bankAccountName,
        bankAccountNumber,
      });

      if (res.success) {
        toast.success("Profil lembaga diperbarui");
        router.refresh();
      } else {
        toast.error("Gagal update", { description: res.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profil Lembaga</CardTitle>
        <CardDescription>
          Data ini ditampilkan di direktori publik &amp; email donor receipt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Nama Lembaga <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@lembaga.org"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">No. HP / Telepon</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="021-xxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Alamat</Label>
            <textarea
              id="address"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background min-h-[60px]"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jalan, kota, kode pos"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://lembaga.org"
            />
          </div>

          <div className="pt-3 border-t">
            <p className="text-sm font-semibold mb-3">Rekening Bank (untuk donor receipt)</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="bankname">Nama Bank</Label>
                <Input
                  id="bankname"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank Syariah Indonesia"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banknumber">No. Rekening</Label>
                <Input
                  id="banknumber"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="7100000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bankan">Atas Nama</Label>
                <Input
                  id="bankan"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="BAZNAS Provinsi..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t">
            <Button type="submit" disabled={!isDirty || pending}>
              {pending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              Simpan Perubahan
            </Button>
            {isDirty && (
              <Button type="button" variant="outline" onClick={handleReset} disabled={pending}>
                <RotateCcw className="size-4 mr-2" />
                Batal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
