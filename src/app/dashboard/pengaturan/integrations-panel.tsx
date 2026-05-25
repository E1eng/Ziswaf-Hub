"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plug,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Provider = "MIDTRANS" | "XENDIT" | "FLIP" | "BANK_CSV";

interface Integration {
  id: string;
  provider: Provider;
  is_active: boolean;
  created_at: string;
}

interface ProviderConfig {
  provider: Provider;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: "MIDTRANS",
    name: "Midtrans",
    description: "Payment gateway populer di Indonesia. Mendukung transfer bank, e-wallet, dan kartu kredit.",
    icon: CreditCard,
    color: "text-blue-600",
    fields: [
      { key: "server_key", label: "Server Key", placeholder: "SB-Mid-server-xxxx", type: "password" },
      { key: "client_key", label: "Client Key", placeholder: "SB-Mid-client-xxxx" },
      { key: "is_production", label: "Mode Production?", placeholder: "true / false" },
    ],
  },
  {
    provider: "XENDIT",
    name: "Xendit",
    description: "Platform disbursement & payment. Cocok untuk penyaluran ke banyak rekening sekaligus.",
    icon: Zap,
    color: "text-indigo-600",
    fields: [
      { key: "secret_key", label: "Secret API Key", placeholder: "xnd_development_xxxx", type: "password" },
      { key: "callback_token", label: "Callback Token", placeholder: "token-xxxx", type: "password" },
    ],
  },
  {
    provider: "FLIP",
    name: "Flip for Business",
    description: "Transfer antar bank tanpa biaya. Ideal untuk disbursement ke rekening penerima manfaat.",
    icon: Building2,
    color: "text-orange-600",
    fields: [
      { key: "secret_key", label: "Secret Key", placeholder: "flip-secret-xxxx", type: "password" },
      { key: "validation_token", label: "Validation Token", placeholder: "flip-token-xxxx", type: "password" },
    ],
  },
  {
    provider: "BANK_CSV",
    name: "Export CSV Bank",
    description: "Export file CSV untuk upload manual ke Corporate Banking (BCA, Mandiri, BNI, BSI).",
    icon: FileSpreadsheet,
    color: "text-emerald-600",
    fields: [
      { key: "bank_name", label: "Nama Bank", placeholder: "BSI / BNI / Mandiri / BCA" },
      { key: "account_number", label: "Nomor Rekening Sumber", placeholder: "1234567890" },
      { key: "account_name", label: "Nama Pemilik Rekening", placeholder: "Yayasan ZISWAF Amanah" },
    ],
  },
];

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchIntegrations = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("institution_integrations")
      .select("id, provider, is_active, created_at");
    setIntegrations((data as Integration[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const getStatus = (provider: Provider) => {
    return integrations.find((i) => i.provider === provider && i.is_active);
  };

  const handleConfigure = (config: ProviderConfig) => {
    setSelectedProvider(config);
    setFormData({});
    setMessage(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProvider) return;
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Get current user's institution (simplified — uses first institution)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: "error", text: "Anda harus login terlebih dahulu." });
        setSaving(false);
        return;
      }

      const { data: instData } = await supabase
        .from("institutions")
        .select("id")
        .limit(1)
        .single();

      if (!instData) {
        setMessage({ type: "error", text: "Lembaga tidak ditemukan." });
        setSaving(false);
        return;
      }

      // Upsert integration
      const { error } = await supabase
        .from("institution_integrations")
        .upsert(
          {
            institution_id: instData.id,
            provider: selectedProvider.provider,
            credentials: formData,
            is_active: true,
          },
          { onConflict: "institution_id,provider" }
        );

      if (error) {
        setMessage({ type: "error", text: `Gagal menyimpan: ${error.message}` });
      } else {
        setMessage({ type: "success", text: "Integrasi berhasil disimpan!" });
        await fetchIntegrations();
        setTimeout(() => setDialogOpen(false), 1200);
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan. Coba lagi." });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (provider: Provider) => {
    const supabase = createClient();
    const integration = integrations.find((i) => i.provider === provider);
    if (!integration) return;

    await supabase
      .from("institution_integrations")
      .update({ is_active: false })
      .eq("id", integration.id);

    await fetchIntegrations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plug className="size-5" />
            <CardTitle className="text-xl">Integrasi Pihak Ketiga</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Hubungkan payment gateway untuk penyaluran otomatis. Platform tidak menyimpan dana — hanya mengorkestrasi disbursement via API lembaga Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROVIDERS.map((config) => {
              const active = getStatus(config.provider);
              const Icon = config.icon;
              return (
                <div
                  key={config.provider}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    active
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-base">{config.name}</p>
                        <Badge
                          variant={active ? "default" : "secondary"}
                          className="text-xs mt-1"
                        >
                          {active ? (
                            <>
                              <CheckCircle className="size-3 mr-1" />
                              Terhubung
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3 mr-1" />
                              Belum Terhubung
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {config.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={active ? "outline" : "default"}
                      onClick={() => handleConfigure(config)}
                    >
                      {active ? "Ubah Konfigurasi" : "Hubungkan"}
                    </Button>
                    {active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDisconnect(config.provider)}
                      >
                        Putuskan
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Konfigurasi {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription>
              Masukkan kredensial API dari akun {selectedProvider?.name} Anda.
              Data disimpan terenkripsi dan hanya digunakan untuk disbursement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProvider?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-sm font-medium">{field.label}</Label>
                <Input
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="h-10"
                />
              </div>
            ))}
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan & Aktifkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
