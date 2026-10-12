import React from "react";
import { statusClass } from "@/lib/api";

export default function StatusBadge({ status, testid }) {
  return (
    <span className={`badge-status ${statusClass(status)}`} data-testid={testid}>
      <span className="dot" />
      {status}
    </span>
  );
}
