export const STORE_TRANSFER_UI = {
  out: {
    label: "მაღაზიაში გადატანა",
    direction: "საწყობი → მაღაზია",
    sign: "−",
    text: "text-amber-800",
    surface: "bg-amber-50 text-amber-800",
    button: "bg-amber-700 text-white hover:bg-amber-800 focus-visible:outline-amber-700",
    secondary: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    focus: "focus:border-amber-700 focus:ring-amber-600/20",
    result: "hover:bg-amber-50",
    selectedResult: "bg-amber-50 ring-1 ring-inset ring-amber-300",
    selectedType: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-300",
  },
  return: {
    label: "საწყობში დაბრუნება",
    direction: "მაღაზია → საწყობი",
    sign: "+",
    text: "text-blue-800",
    surface: "bg-blue-50 text-blue-800",
    button: "bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline-blue-700",
    secondary: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
    focus: "focus:border-blue-700 focus:ring-blue-600/20",
    result: "hover:bg-blue-50",
    selectedResult: "bg-blue-50 ring-1 ring-inset ring-blue-300",
    selectedType: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-300",
  },
} as const;

export const formatStoreTransferDate = (value: Date) => {
  const months = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
  return `${value.getDate()} ${months[value.getMonth()]} ${value.getFullYear()}, ${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
};
