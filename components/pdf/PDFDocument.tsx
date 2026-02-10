"use client";

import { Document, Page, Image, View, StyleSheet } from "@react-pdf/renderer";

// A4: 210mm x 297mm
// 半分: 148.5mm
const styles = StyleSheet.create({
  page: {
    position: "relative",
  },
  outImage: {
    position: "absolute",
    width: "130mm",
    top: "5.75mm",
    left: "40mm",
  },
  inImage: {
    position: "absolute",
    width: "130mm",
    top: "154.25mm",
    left: "40mm",
  },
  foldLine: {
    position: "absolute",
    top: "148.5mm",
    left: "10mm",
    width: "190mm",
    borderTop: "0.5pt solid black",
  },
});

interface Props {
  outImageUrl: string;
  inImageUrl: string;
}

const PDFDoc: React.FC<Props> = ({ outImageUrl, inImageUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image src={outImageUrl} style={styles.outImage} />
      <Image src={inImageUrl} style={styles.inImage} />
      <View style={styles.foldLine} />
    </Page>
  </Document>
);
export default PDFDoc;
