"use client";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { POPULAR_CALLING_CODES, getMaxDigitsForCountry, type CountryCode } from "@/utils/phone";
import { useThemeColors } from "@/hooks/useThemeColors";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  callingCode: string;
  onCallingCodeChange: (code: string, country: CountryCode) => void;
  selectedCountry: CountryCode;
  placeholder?: string;
  error?: string;
};

export default function PhoneInput({
  value,
  onChangeText,
  callingCode,
  onCallingCodeChange,
  selectedCountry,
  placeholder = "Phone number",
  error,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const maxLength = getMaxDigitsForCountry(selectedCountry);
  const { palette } = useThemeColors();
  const themed = {
    container: { borderColor: palette.border, backgroundColor: palette.surface },
    text: { color: palette.textPrimary },
    divider: { backgroundColor: palette.border },
    sheet: { backgroundColor: palette.surface },
  };

  return (
    <View>
      <View style={[styles.container, themed.container, error ? styles.containerError : null]}>
        <TouchableOpacity style={styles.codeButton} onPress={() => setShowPicker(true)}>
          <Text style={[styles.codeText, themed.text]}>+{callingCode}</Text>
          <ChevronDown size={14} color={palette.textMuted} />
        </TouchableOpacity>
        <View style={[styles.divider, themed.divider]} />
        <TextInput
          style={[styles.input, themed.text]}
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/\D/g, ""))}
          placeholder={placeholder}
          placeholderTextColor={palette.placeholder}
          keyboardType="phone-pad"
          maxLength={maxLength}
          autoComplete="tel-national"
          textContentType="telephoneNumber"
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowPicker(false)}
          activeOpacity={1}
        >
          <View style={[styles.pickerSheet, themed.sheet]}>
            <Text style={[styles.pickerTitle, themed.text]}>Select country code</Text>
            <FlatList
              data={POPULAR_CALLING_CODES}
              keyExtractor={(item) => `${item.country}-${item.code}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    onCallingCodeChange(item.code, item.country);
                    setShowPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, themed.text]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderColor: "#d1d5dc",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  containerError: {
    borderColor: "#ef4444",
  },
  codeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 4,
  },
  codeText: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#d1d5dc",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#1a1a1a",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#ef4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: "60%",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
});
