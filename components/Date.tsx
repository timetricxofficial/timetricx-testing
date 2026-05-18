import React from "react";

interface DateProps {
  date: string | Date | null | undefined;
  className?: string;
}

const formatDate = (input: string | Date | null | undefined): string => {
  if (!input) return "-";
  
  try {
    const date = typeof input === "string" ? new Date(input) : input;
    
    if (isNaN(date.getTime())) return "-";
    
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch {
    return "-";
  }
};

const DateDisplay: React.FC<DateProps> = ({ date, className = "" }) => {
  return <span className={className}>{formatDate(date)}</span>;
};

export { formatDate };
export default DateDisplay;
