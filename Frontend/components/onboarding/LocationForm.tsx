import { View } from "react-native";
import { SelectRow } from "@/components/ui";
import { FormField } from "@/components/auth";
import { COUNTRIES, statesFor } from "./locations.data";

export type LocationFormValue = {
  country: string | null;
  state: string | null;
  city: string;
  address: string;
};

export type LocationFormProps = {
  value: LocationFormValue;
  onChange: (value: LocationFormValue) => void;
  errors?: Partial<Record<keyof LocationFormValue, string>>;
};

/** Country/state selects + city/address inputs (Figma 1288:5118).
 *  City is free-text in v1 — the static dataset stops at state level. */
export function LocationForm({ value, onChange, errors }: LocationFormProps) {
  return (
    <View>
      <SelectRow
        label="Select country"
        value={value.country}
        options={COUNTRIES}
        onChange={(country) => onChange({ ...value, country, state: null })}
        placeholder="Select country"
        error={errors?.country}
      />
      <SelectRow
        label="Select State"
        value={value.state}
        options={statesFor(value.country)}
        onChange={(state) => onChange({ ...value, state })}
        placeholder="Select state"
        error={errors?.state}
        disabled={!value.country}
      />
      <FormField
        label="City"
        value={value.city}
        onChangeText={(city) => onChange({ ...value, city })}
        placeholder="Enter city"
        error={errors?.city}
        autoCapitalize="words"
      />
      <FormField
        label="Enter address"
        value={value.address}
        onChangeText={(address) => onChange({ ...value, address })}
        placeholder="Street address"
        error={errors?.address}
        autoCapitalize="words"
      />
    </View>
  );
}
