"use client";

import { useActionState } from "react";
import { updateOrderStatus } from "@/app/admin/actions/commerce";
import type { OrderStatus } from "@/db/schema";
import { statusMeta } from "@/lib/order-status";
import { FormMessage, Select, SubmitButton } from "./ui";

export function OrderStatusForm({ id, status }: { id: string; status: OrderStatus }) {
  const [state, action] = useActionState(updateOrderStatus, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <Select label="وضعیت" name="status" defaultValue={status}>
        {(Object.keys(statusMeta) as OrderStatus[]).map((s) => (
          <option key={s} value={s}>{statusMeta[s].label}</option>
        ))}
      </Select>
      <FormMessage state={state} />
      <SubmitButton className="w-full">ذخیره وضعیت</SubmitButton>
    </form>
  );
}
