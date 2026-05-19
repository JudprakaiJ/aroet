export type ServiceType = { code: string; name: string; short: string };

export const SERVICE_TYPES: ServiceType[] = [
  { code: "7505",   name: "Curative maintenance",    short: "Curative" },
  { code: "7504",   name: "Installation",            short: "Install" },
  { code: "7515",   name: "Curative under Warranty", short: "Warranty" },
  { code: "7508",   name: "Upgrade installation",    short: "Upgrade" },
  { code: "7507",   name: "Preventive Maintenance",  short: "PM" },
  { code: "7512",   name: "Service Agreement",       short: "Service Agr." },
  { code: "7235",   name: "Service Promotion",       short: "Promo" },
  { code: "7506",   name: "Customer Training",       short: "Training" },
  { code: "7506-1", name: "Internal Training",       short: "Internal Tr." },
];

export function findServiceType(code: string | null | undefined): ServiceType | undefined {
  if (!code) return undefined;
  return SERVICE_TYPES.find((s) => s.code === code);
}
