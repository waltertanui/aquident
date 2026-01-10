import React from "react";
import Button from "../ui/Button";

type Props = {
  title: string;
  action?: { label: string; onClick?: () => void };
  children?: React.ReactNode;
};

function PageHeader({ title, action, children }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children && <div className="mt-2 text-sm text-gray-600">{children}</div>}
      </div>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

export default PageHeader;