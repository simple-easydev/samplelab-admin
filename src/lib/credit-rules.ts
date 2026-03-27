import { supabase } from "@/lib/supabase";

export interface CreditRulesConfig {
  loops_compositions: number;
  one_shots: number;
  stems: number;
  full_pack_download: number;
  allow_pack_overrides: boolean;
}

export const DEFAULT_CREDIT_RULES: CreditRulesConfig = {
  loops_compositions: 2,
  one_shots: 1,
  stems: 5,
  full_pack_download: 8,
  allow_pack_overrides: true,
};

export const CREDIT_RULE_SETTING_KEYS = {
  loops_compositions: "credit_rules.loops_compositions",
  one_shots: "credit_rules.one_shots",
  stems: "credit_rules.stems",
  full_pack_download: "credit_rules.full_pack_download",
  allow_pack_overrides: "credit_rules.allow_pack_overrides",
} as const;

export function getCreditCostForSampleType(
  sampleType: string,
  rules: CreditRulesConfig = DEFAULT_CREDIT_RULES
): number {
  const normalized = sampleType.trim().toLowerCase();
  if (normalized === "one-shot" || normalized === "one_shot" || normalized === "oneshot") {
    return rules.one_shots;
  }
  return rules.loops_compositions;
}

export async function fetchCreditRulesFromSettings(): Promise<CreditRulesConfig> {
  const settingKeys = Object.values(CREDIT_RULE_SETTING_KEYS);
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", settingKeys);

  if (error) throw error;

  const settingsMap = new Map<string, string>();
  ((data as Array<{ key: string; value: string | null }> | null) || []).forEach((row) => {
    settingsMap.set(row.key, row.value || "");
  });

  return {
    loops_compositions:
      Number.parseInt(settingsMap.get(CREDIT_RULE_SETTING_KEYS.loops_compositions) || "", 10) ||
      DEFAULT_CREDIT_RULES.loops_compositions,
    one_shots:
      Number.parseInt(settingsMap.get(CREDIT_RULE_SETTING_KEYS.one_shots) || "", 10) ||
      DEFAULT_CREDIT_RULES.one_shots,
    stems:
      Number.parseInt(settingsMap.get(CREDIT_RULE_SETTING_KEYS.stems) || "", 10) ||
      DEFAULT_CREDIT_RULES.stems,
    full_pack_download:
      Number.parseInt(settingsMap.get(CREDIT_RULE_SETTING_KEYS.full_pack_download) || "", 10) ||
      DEFAULT_CREDIT_RULES.full_pack_download,
    allow_pack_overrides:
      (settingsMap.get(CREDIT_RULE_SETTING_KEYS.allow_pack_overrides) ?? "").toLowerCase() === "true"
        ? true
        : (settingsMap.get(CREDIT_RULE_SETTING_KEYS.allow_pack_overrides) ?? "") === ""
          ? DEFAULT_CREDIT_RULES.allow_pack_overrides
          : false,
  };
}
