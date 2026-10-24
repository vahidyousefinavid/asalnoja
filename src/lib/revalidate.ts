import { revalidatePath } from "next/cache";

/** بعد از هر تغییر در پنل، همه صفحات فروشگاه از نو ساخته می‌شوند */
export function refreshStore() {
  revalidatePath("/", "layout");
}
