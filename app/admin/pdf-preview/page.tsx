"use client";
import { useRouter } from "next/navigation";

import GreenCardGridPDFExport, {
  HolePin,
} from "@/components/greens/GreenCardGridPDFExport";

const testPins: HolePin[] = [
  { hole: 1, x: 30, y: 35 },
  { hole: 2, x: 25, y: 30 },
  { hole: 3, x: 35, y: 40 },
  { hole: 4, x: 28, y: 25 },
  { hole: 5, x: 32, y: 38 },
  { hole: 6, x: 30, y: 32 },
  { hole: 7, x: 26, y: 36 },
  { hole: 8, x: 34, y: 28 },
  { hole: 9, x: 30, y: 42 },
  { hole: 10, x: 28, y: 34 },
  { hole: 11, x: 33, y: 30 },
  { hole: 12, x: 30, y: 37 },
  { hole: 13, x: 27, y: 32 },
  { hole: 14, x: 35, y: 35 },
  { hole: 15, x: 30, y: 28 },
  { hole: 16, x: 31, y: 40 },
  { hole: 17, x: 25, y: 33 },
  { hole: 18, x: 30, y: 36 },
];
export default function PDFPreviewPage() {
  const router = useRouter();

  return (
    <div>
      <div className="p-8">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          PDF
        </button>
      </div>

      {/* OUT */}
      <div className="mb-4">
        <GreenCardGridPDFExport course="out" pins={testPins} />
      </div>

      {/* IN */}
      <div>
        <GreenCardGridPDFExport course="in" pins={testPins} />
      </div>
    </div>
  );
}
