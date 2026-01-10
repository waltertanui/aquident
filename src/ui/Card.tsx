import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

function Card({ children, className = "" }: Props) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default Card;