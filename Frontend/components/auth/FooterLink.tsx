import { Text, Pressable } from "react-native";

export type FooterLinkProps = {
  /** Leading text, e.g. "Already have an account?" */
  prompt: string;
  /** Highlighted action word, e.g. "Login" */
  action: string;
  onPress: () => void;
};

/** Centered footer prompt with an accent action link. */
export function FooterLink({ prompt, action, onPress }: FooterLinkProps) {
  return (
    <Pressable onPress={onPress} className="items-center mt-6" accessibilityRole="link">
      <Text className="text-base text-black">
        {prompt} <Text className="text-[#ff6633] underline">{action}</Text>
      </Text>
    </Pressable>
  );
}
