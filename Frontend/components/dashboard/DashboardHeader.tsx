import { HomeHeader, type HomeHeaderProps } from "@/components/home/HomeHeader";

/** Dashboard reuses the member HomeHeader shell — same visual signature per
 *  Figma (location pin, bell, avatar). Prop-passthrough so this can gain
 *  host-specific behavior later without touching callers. */
export type DashboardHeaderProps = HomeHeaderProps;
export function DashboardHeader(props: DashboardHeaderProps) {
  return <HomeHeader {...props} />;
}
