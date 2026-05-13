"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export interface CustomerContactInput {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  is_primary?: boolean;
}

export interface CustomerInput {
  code?: string;
  name: string;
  city?: string;
  country?: string;
  address?: string;
  notes?: string;
  contacts?: CustomerContactInput[];
}

export async function createCustomer(
  input: CustomerInput
): Promise<{ success: boolean; code?: string; error?: string }> {
  const supabase = createServiceClient();

  if (!input.name?.trim()) return { success: false, error: "Legal name required" };

  let code = input.code?.trim();
  if (!code) {
    code = input.name.trim().replace(/[^A-Z]/gi, "").substring(0, 4).toUpperCase();
    if (!code) code = "CUST";
    const { data: existing } = await supabase.from("customers").select("code").like("code", `${code}%`);
    const usedCodes = new Set((existing || []).map((x: any) => x.code));
    let suffix = 1;
    let candidate = `${code}${suffix.toString().padStart(2, "0")}`;
    while (usedCodes.has(candidate)) {
      suffix++;
      candidate = `${code}${suffix.toString().padStart(2, "0")}`;
    }
    code = candidate;
  }

  const { data: dup } = await supabase.from("customers").select("code").eq("code", code).maybeSingle();
  if (dup) return { success: false, error: `Customer code "${code}" already exists` };

  const primaryContact = (input.contacts || []).find((c) => c.is_primary) || input.contacts?.[0];

  const { error: custError } = await supabase.from("customers").insert({
    code,
    name: input.name.trim(),
    city: input.city?.trim() || null,
    country: input.country?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
    contact_name: primaryContact?.name?.trim() || null,
    contact_mobile: primaryContact?.phone?.trim() || null,
  });
  if (custError) return { success: false, error: custError.message };

  const contacts = input.contacts || [];
  if (contacts.length > 0) {
    const hasPrimary = contacts.some((c) => c.is_primary);
    const contactRows = contacts
      .filter((c) => c.name?.trim())
      .map((c, i) => ({
        customer_code: code,
        name: c.name.trim(),
        role: c.role?.trim() || null,
        phone: c.phone?.trim() || null,
        email: c.email?.trim() || null,
        is_primary: c.is_primary || (!hasPrimary && i === 0),
      }));

    if (contactRows.length > 0) {
      const { error } = await supabase.from("customer_contacts").insert(contactRows);
      if (error) console.error("[createCustomer] contacts:", error.message);
    }
  }

  revalidatePath("/customers");
  revalidatePath("/cases/new");
  return { success: true, code };
}

export async function addContactToCustomer(
  customerCode: string,
  contact: CustomerContactInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!contact.name?.trim()) return { success: false, error: "Contact name required" };

  if (contact.is_primary) {
    await supabase
      .from("customer_contacts")
      .update({ is_primary: false })
      .eq("customer_code", customerCode);
  }

  const { error } = await supabase.from("customer_contacts").insert({
    customer_code: customerCode,
    name: contact.name.trim(),
    role: contact.role?.trim() || null,
    phone: contact.phone?.trim() || null,
    email: contact.email?.trim() || null,
    is_primary: contact.is_primary || false,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/customers");
  return { success: true };
}

export async function deleteContact(contactId: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("customer_contacts").delete().eq("id", contactId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/customers");
  return { success: true };
}
