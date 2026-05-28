import { PageHeader } from "@/components/page-header";
import { InputDataForm } from "./input-form";
import { createClient } from "@/lib/supabase/server";

async function getFormOptions() {
  const supabase = await createClient();

  const [{ data: regions }, { data: categories }, { data: sectors }, { data: inst }] = await Promise.all([
    supabase.from("regions").select("id, name").eq("type", "provinsi").order("name"),
    supabase.from("ziswaf_categories").select("id, name, category").order("sort_order"),
    supabase.from("distribution_sectors").select("id, name, code").order("sort_order"),
    supabase.from("institutions").select("id").eq("status", "active").limit(1).single(),
  ]);

  return {
    regions: regions || [],
    categories: categories || [],
    sectors: sectors || [],
    institutionId: inst?.id || "",
  };
}

export default async function InputPage() {
  const options = await getFormOptions();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Tambah Data"
        description="Catat data pengumpulan atau penyaluran lembaga Anda"
      />
      <main className="flex-1 p-6">
        <InputDataForm
          regions={options.regions}
          categories={options.categories}
          sectors={options.sectors}
          institutionId={options.institutionId}
        />
      </main>
    </div>
  );
}
