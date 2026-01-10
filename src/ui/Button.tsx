import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

function Button({ children, className = "", ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;