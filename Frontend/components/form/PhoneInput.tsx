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

  return (
    <View>
      <View style={[styles.container, error ? styles.containerError : null]}>
        <TouchableOpacity style={styles.codeButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.codeText}>+{callingCode}</Text>
          <ChevronDown size={14} color="#666" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/\D/g, ""))}
          placeholder={placeholder}
          placeholderTextColor="#b0b0b0"
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
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select country code</Text>
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
                  <Text style={styles.pickerItemText}>{item.label}</Text>
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
