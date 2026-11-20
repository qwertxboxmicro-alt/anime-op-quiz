import { Pixelify_Sans, Space_Mono } from "next/font/google";
import { HubProvider } from "@/platform/hub";
import { Rail, TopBar } from "@/components/hub/Shell";
import "./hub.css";

const display = Pixelify_Sans({ subsets: ["latin"], weight: ["500", "700"], variable: "--f-display" });
const label = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-label" });

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <HubProvider>
      <div className={`hub ${display.variable} ${label.variable}`}>
        <Rail />
        <div className="h-main">
          <TopBar />
          {children}
        </div>
      </div>
    </HubProvider>
  );
}
